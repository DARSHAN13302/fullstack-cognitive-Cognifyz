'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ItemRepository } = require('./server');

const repo = new ItemRepository();
const created = repo.create('Ship React 18 UI', 'in_progress');
assert.strictEqual(created.id, 2);
const updated = repo.update(2, { status: 'done' });
assert.strictEqual(updated.status, 'done');
assert.strictEqual(repo.remove(2), true);
assert.strictEqual(fs.existsSync(path.join(__dirname, 'frontend/src/App.jsx')), true);
console.log('Task 5 STLC suite PASSED (4/4 assertions + React JSX verified)');
