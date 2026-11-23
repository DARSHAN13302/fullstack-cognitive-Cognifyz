'use strict';
const assert = require('assert');
const { verifyResponsiveAssets } = require('./server');

const r = verifyResponsiveAssets();
assert.strictEqual(r.hasBootstrap, true);
assert.strictEqual(r.hasViewportMeta, true);
assert.strictEqual(r.hasTransitions, true);
assert.strictEqual(r.hasMediaQuery, true);
console.log('Task 3 STLC suite PASSED (4/4 assertions)');
