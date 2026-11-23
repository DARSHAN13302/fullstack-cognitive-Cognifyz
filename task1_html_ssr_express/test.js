'use strict';
const assert = require('assert');
const { processSubmission, AuditChain } = require('./server');

const audit = new AuditChain('task1-test');
const bad = processSubmission({ fullName: 'A', email: 'invalid' }, audit);
assert.strictEqual(bad.ok, false);

const good = processSubmission({ fullName: 'Darshan S', email: 'darshan@example.com', track: 'AI Engineering' }, audit);
assert.strictEqual(good.ok, true);
assert.ok(good.submission.maskedEmail.includes('***'));
assert.strictEqual(audit.verify().valid, true);
console.log('Task 1 STLC suite PASSED (3/3 assertions)');
