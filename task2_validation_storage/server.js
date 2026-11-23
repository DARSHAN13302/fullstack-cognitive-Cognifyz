'use strict';
const path = require('path');
const { AuditChain, maskPII, wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');

const tempStore = [];

function validatePayload(payload = {}) {
  const errors = [];
  const username = String(payload.username || '').trim();
  const email = String(payload.email || '').trim();
  const age = Number(payload.age);
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) errors.push('Username must be 3-24 alphanumeric characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required.');
  if (!Number.isInteger(age) || age < 18 || age > 99) errors.push('Age must be an integer between 18 and 99.');
  return { valid: errors.length === 0, errors, clean: { username, email, age } };
}

function storeValidatedRecord(payload, audit) {
  const check = validatePayload(payload);
  if (!check.valid) return { ok: false, errors: check.errors };
  const record = { id: tempStore.length + 1, username: check.clean.username, maskedEmail: maskPII(check.clean.email), age: check.clean.age, createdAt: new Date().toISOString() };
  tempStore.push(record);
  if (audit) audit.append(check.clean.email, 'TASK2_RECORD_STORED', { id: record.id });
  return { ok: true, record };
}

function startServer(port = process.env.PORT || 3002) {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  const { audit } = wireEnterpriseExpress(app, 'task2-validation-storage');

  app.post('/api/validate-store', (req, res) => {
    const out = storeValidatedRecord(req.body, audit);
    if (!out.ok) return res.status(400).json({ errors: out.errors });
    return res.status(201).json({ record: out.record, totalStored: tempStore.length });
  });
  app.get('/api/records', (_req, res) => res.json({ count: tempStore.length, records: tempStore }));

  return app.listen(port, () => console.log(`[Task 2] Validation server running on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { validatePayload, storeValidatedRecord, tempStore, startServer, AuditChain };
