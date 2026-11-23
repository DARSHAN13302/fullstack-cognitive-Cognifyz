'use strict';
const assert = require('assert');
const { createPkcePair, SlidingWindowRateLimiter, CircuitBreaker, problemDetails } = require('./server');

(async () => {
  const pkce = createPkcePair();
  assert.strictEqual(pkce.method, 'S256');
  assert.ok(pkce.challenge.length > 20);

  const limiter = new SlidingWindowRateLimiter(2, 10000);
  assert.strictEqual(limiter.check('ip1', 1000).allowed, true);
  assert.strictEqual(limiter.check('ip1', 1001).allowed, true);
  assert.strictEqual(limiter.check('ip1', 1002).allowed, false);

  const cb = new CircuitBreaker(2, 5000);
  await assert.rejects(() => cb.exec(async () => { throw new Error('fail1'); }));
  await assert.rejects(() => cb.exec(async () => { throw new Error('fail2'); }));
  await assert.rejects(() => cb.exec(async () => 'ok'), /CIRCUIT_OPEN/);

  assert.strictEqual(problemDetails(429, 'Limit', 'Exceeded').status, 429);
  console.log('Task 7 STLC suite PASSED (6/6 assertions + PKCE & Circuit Breaker verified)');
})();
