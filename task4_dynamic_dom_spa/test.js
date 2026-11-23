'use strict';
const assert = require('assert');
const { evaluatePasswordStrength, resolveRoute } = require('./public/app');

assert.strictEqual(evaluatePasswordStrength('abc').label, 'Weak');
assert.strictEqual(evaluatePasswordStrength('Str0ng!Pass#2026').label, 'Strong');
assert.strictEqual(resolveRoute('#/security').route, '#/security');
assert.strictEqual(resolveRoute('#/unknown').route, '#/register');
console.log('Task 4 STLC suite PASSED (4/4 assertions)');
