'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { AuditChain, createMetricsCollector, applySecurityHeaders, generateTraceparent } = require('../shared/enterpriseBootstrap');
const { CognitiveDecisionEngine } = require('../shared/cognitiveDecisionEngine');
const t1 = require('../task1_html_ssr_express/server');
const t2 = require('../task2_validation_storage/server');
const t3 = require('../task3_responsive_bootstrap_ui/server');
const t4 = require('../task4_dynamic_dom_spa/public/app');
const t5 = require('../task5_rest_api_react_frontend/server');
const t6 = require('../task6_database_jwt_rbac/server');
const t7 = require('../task7_oauth_external_api_ratelimit/server');
const t8 = require('../task8_redis_queue_cache_cognitive/server');

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('INVALID_JSON')); }
    });
  });
}

function createGatewayServer() {
  const audit = new AuditChain('unified-gateway-v7.2');
  const metrics = createMetricsCollector('unified-gateway-v7.2');
  const brain = new CognitiveDecisionEngine(audit, { hitlThreshold: 0.85 });
  const repo = new t5.ItemRepository();
  const users = new Map();
  const limiter = new t7.SlidingWindowRateLimiter(3, 60000);
  const cache = new t8.TtlCache(30000);
  const queue = new t8.InMemoryJobQueue();
  const indexHtml = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');

  function sendJson(res, status, obj) {
    metrics.record(status);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  }

  return http.createServer(async (req, res) => {
    const tp = req.headers['traceparent'] || generateTraceparent();
    applySecurityHeaders(res, tp);
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const m = req.method;

    try {
      if (m === 'GET' && p === '/') {
        metrics.record(200);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(indexHtml);
      }
      if (m === 'GET' && p === '/health') return sendJson(res, 200, { status: 'ok', version: '7.2.0', traceparent: tp });
      if (m === 'GET' && p === '/metrics') {
        metrics.record(200);
        res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
        return res.end(metrics.renderPrometheus());
      }
      if (m === 'GET' && p === '/audit/verify') return sendJson(res, 200, audit.verify());

      // Task 1: SSR Intake
      if (m === 'POST' && p === '/api/task1/submit') {
        const out = t1.processSubmission(await readJson(req), audit);
        return sendJson(res, out.ok ? 201 : 400, out);
      }
      // Task 2: Dual Validation & Storage
      if (m === 'POST' && p === '/api/task2/validate') {
        const out = t2.storeValidatedRecord(await readJson(req), audit);
        return sendJson(res, out.ok ? 201 : 400, out);
      }
      // Task 3: Responsive Asset Verification
      if (m === 'GET' && p === '/api/task3/verify') {
        return sendJson(res, 200, t3.verifyResponsiveAssets());
      }
      // Task 4: Password Entropy & SPA Route
      if (m === 'POST' && p === '/api/task4/strength') {
        const body = await readJson(req);
        return sendJson(res, 200, { strength: t4.evaluatePasswordStrength(body.password), route: t4.resolveRoute(body.hash) });
      }
      // Task 5: REST CRUD
      if (m === 'GET' && p === '/api/task5/items') return sendJson(res, 200, { items: repo.list() });
      if (m === 'POST' && p === '/api/task5/items') {
        const body = await readJson(req);
        const item = repo.create(body.title, body.status);
        return item ? sendJson(res, 201, item) : sendJson(res, 400, { error: 'Invalid title' });
      }
      // Task 6: Auth + JWT + JTI Revocation
      if (m === 'POST' && p === '/api/task6/register') {
        const { email, password, role = 'viewer' } = await readJson(req);
        if (!email || !password || password.length < 8) return sendJson(res, 400, { error: 'Invalid credentials' });
        users.set(email, { email, passwordHash: t6.hashPassword(password), role });
        return sendJson(res, 201, { registered: true, role });
      }
      if (m === 'POST' && p === '/api/task6/login') {
        const { email, password } = await readJson(req);
        const u = users.get(email);
        if (!u || !t6.verifyPassword(password, u.passwordHash)) return sendJson(res, 401, { error: 'Unauthorized' });
        return sendJson(res, 200, { token: t6.signJwt({ sub: u.email, role: u.role }) });
      }
      if (m === 'POST' && p === '/api/task6/logout') {
        const check = t6.verifyJwt((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
        if (!check.valid) return sendJson(res, 401, { error: check.error });
        t6.revokeJwt(check.claims.jti);
        return sendJson(res, 200, { revoked: true });
      }
      if (m === 'GET' && p === '/api/task6/admin') {
        const check = t6.verifyJwt((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
        if (!check.valid) return sendJson(res, 401, { error: check.error });
        if (check.claims.role !== 'admin') return sendJson(res, 403, { error: 'FORBIDDEN_ROLE' });
        return sendJson(res, 200, { adminAccess: true, user: check.claims.sub });
      }
      // Task 7: OAuth PKCE + Sliding-Window Rate Limiter
      if (m === 'GET' && p === '/api/task7/pkce') {
        const r = limiter.check(req.headers['x-client-key'] || 'default');
        if (!r.allowed) return sendJson(res, 429, t7.problemDetails(429, 'Too Many Requests', 'Rate limit exceeded'));
        return sendJson(res, 200, { pkce: t7.createPkcePair(), remaining: r.remaining });
      }
      // Task 8: TTL Cache, Job Queue & Cognitive Decision Engine
      if (m === 'GET' && p.startsWith('/api/task8/cache/')) {
        const key = p.split('/').pop();
        const hit = cache.get(key);
        if (hit) return sendJson(res, 200, { cache: 'HIT', value: hit });
        const val = { key, computedAt: new Date().toISOString() };
        cache.set(key, val);
        return sendJson(res, 200, { cache: 'MISS', value: val });
      }
      if (m === 'POST' && p === '/api/task8/jobs') {
        const body = await readJson(req);
        const job = queue.enqueue(body.type || 'digest', body.payload || {});
        const done = await queue.processNext(async (j) => ({ ok: true, type: j.type }));
        return sendJson(res, 202, { jobId: job.id, completed: done });
      }
      if (m === 'POST' && p === '/api/task8/decide') {
        const out = brain.decide(await readJson(req));
        const code = out.decision === 'BLOCKED' ? 400 : out.decision === 'DENIED' ? 403 : 200;
        return sendJson(res, code, out);
      }

      return sendJson(res, 404, { error: 'NOT_FOUND', path: p });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createGatewayServer().listen(port, () => console.log(`[Gateway v7.2] Unified 8-task server listening on http://localhost:${port}`));
}

module.exports = { createGatewayServer };
