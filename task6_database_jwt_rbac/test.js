'use strict';
const assert = require('assert');
const { hashPassword, verifyPassword, signJwt, verifyJwt, revokeJwt } = require('./server');

const h = hashPassword('MySecurePass!2026');
assert.strictEqual(verifyPassword('MySecurePass!2026', h), true);
assert.strictEqual(verifyPassword('WrongPass', h), false);

const token = signJwt({ sub: 'admin@example.com', role: 'admin' });
const ok = verifyJwt(token);
assert.strictEqual(ok.valid, true);
assert.strictEqual(ok.claims.role, 'admin');

revokeJwt(ok.claims.jti);
const revoked = verifyJwt(token);
assert.strictEqual(revoked.valid, false);
assert.strictEqual(revoked.error, 'TOKEN_REVOKED');
console.log('Task 6 STLC suite PASSED (5/5 assertions + JWT revocation verified)');
