'use strict';
const { AuditChain, wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');
const { CognitiveDecisionEngine } = require('../shared/cognitiveDecisionEngine');
const { InMemoryJobQueue } = require('./worker');

class TtlCache {
  constructor(defaultTtlMs = 30000) {
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();
  }
  set(key, val, ttlMs = this.defaultTtlMs) {
    this.map.set(key, { val, exp: Date.now() + ttlMs });
  }
  get(key) {
    const item = this.map.get(key);
    if (!item || Date.now() > item.exp) { this.map.delete(key); return null; }
    return item.val;
  }
}

function startServer(port = process.env.PORT || 3008) {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const { audit } = wireEnterpriseExpress(app, 'task8-redis-queue-cache-cognitive');
  const brain = new CognitiveDecisionEngine(audit, { hitlThreshold: 0.85 });
  const cache = new TtlCache(30000);
  const queue = new InMemoryJobQueue();

  app.post('/api/decide', (req, res) => {
    const decision = brain.decide(req.body || {});
    const status = decision.decision === 'BLOCKED' ? 400 : decision.decision === 'DENIED' ? 403 : 200;
    return res.status(status).json(decision);
  });

  app.get('/api/cache/:key', (req, res) => {
    const hit = cache.get(req.params.key);
    if (hit) return res.json({ cache: 'HIT', value: hit });
    const computed = { key: req.params.key, computedAt: new Date().toISOString() };
    cache.set(req.params.key, computed);
    return res.json({ cache: 'MISS', value: computed });
  });

  app.post('/api/jobs', async (req, res) => {
    const job = queue.enqueue(req.body.type || 'audit_digest', req.body.payload || {});
    const done = await queue.processNext(async (j) => ({ processed: true, type: j.type }));
    res.status(202).json({ queued: job.id, completed: done });
  });

  return app.listen(port, () => console.log(`[Task 8] Redis Queue, Cache & Cognitive Decision Server on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { TtlCache, InMemoryJobQueue, CognitiveDecisionEngine, AuditChain, startServer };
