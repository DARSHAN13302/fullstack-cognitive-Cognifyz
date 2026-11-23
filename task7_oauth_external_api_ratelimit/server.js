'use strict';
const crypto = require('crypto');
const { wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');

function createPkcePair() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge, method: 'S256' };
}

class SlidingWindowRateLimiter {
  constructor(limit = 60, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.hits = new Map();
  }
  check(key, now = Date.now()) {
    const arr = (this.hits.get(key) || []).filter((ts) => now - ts < this.windowMs);
    if (arr.length >= this.limit) return { allowed: false, remaining: 0, retryAfterMs: this.windowMs - (now - arr[0]) };
    arr.push(now);
    this.hits.set(key, arr);
    return { allowed: true, remaining: this.limit - arr.length };
  }
}

class CircuitBreaker {
  constructor(failureThreshold = 3, resetMs = 30000) {
    this.failureThreshold = failureThreshold;
    this.resetMs = resetMs;
    this.failures = 0;
    this.openedAt = null;
  }
  async exec(fn) {
    if (this.openedAt && Date.now() - this.openedAt < this.resetMs) {
      throw new Error('CIRCUIT_OPEN');
    }
    try {
      const res = await fn();
      this.failures = 0;
      this.openedAt = null;
      return res;
    } catch (err) {
      this.failures += 1;
      if (this.failures >= this.failureThreshold) this.openedAt = Date.now();
      throw err;
    }
  }
}

function problemDetails(status, title, detail) {
  return { type: `https://httpstatuses.com/${status}`, title, status, detail };
}

function startServer(port = process.env.PORT || 3007) {
  const express = require('express');
  const app = express();
  app.use(express.static(require('path').join(__dirname, 'public')));
  const limiter = new SlidingWindowRateLimiter(30, 60000);
  const breaker = new CircuitBreaker(3, 15000);
  wireEnterpriseExpress(app, 'task7-oauth-external-api-ratelimit');

  app.use((req, res, next) => {
    const r = limiter.check(req.ip || 'local');
    if (!r.allowed) return res.status(429).json(problemDetails(429, 'Too Many Requests', 'Sliding window rate limit exceeded.'));
    res.setHeader('X-RateLimit-Remaining', String(r.remaining));
    return next();
  });

  app.get('/api/oauth/pkce', (_req, res) => {
    const pkce = createPkcePair();
    const state = crypto.randomBytes(16).toString('hex');
    res.json({ authorizationEndpoint: process.env.OAUTH_AUTH_URL || 'https://github.com/login/oauth/authorize', state, codeChallenge: pkce.challenge, codeChallengeMethod: pkce.method });
  });

  app.get('/api/external/quote', async (_req, res) => {
    try {
      const data = await breaker.exec(async () => ({ provider: 'external-upstream', status: 'ok', fetchedAt: new Date().toISOString() }));
      res.json(data);
    } catch (err) {
      res.status(503).json(problemDetails(503, 'Upstream Unavailable', err.message));
    }
  });

  return app.listen(port, () => console.log(`[Task 7] OAuth + RateLimit server on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { createPkcePair, SlidingWindowRateLimiter, CircuitBreaker, problemDetails, startServer };
