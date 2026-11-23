'use strict';
const assert = require('assert');
const { storeValidatedRecord, AuditChain } = require('./server');

const audit = new AuditChain('task2-test');
const bad = storeValidatedRecord({ username: 'x', email: 'bad', age: 12 }, audit);
assert.strictEqual(bad.ok, false);
assert.strictEqual(bad.errors.length, 3);

const good = storeValidatedRecord({ username: 'dev_user1', email: 'dev@example.com', age: 25 }, audit);
assert.strictEqual(good.ok, true);
assert.strictEqual(good.record.id, 1);
assert.strictEqual(audit.verify().valid, true);
console.log('Task 2 STLC suite PASSED (4/4 assertions)');
