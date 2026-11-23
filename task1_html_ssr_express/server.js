'use strict';
const path = require('path');
const { AuditChain, maskPII, wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');

function processSubmission({ fullName = '', email = '', track = 'Full-Stack' }, audit) {
  const cleanName = String(fullName).trim();
  const cleanEmail = String(email).trim();
  if (cleanName.length < 2 || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Valid name (>=2 chars) and email are required.' };
  }
  const entry = audit.append(cleanEmail, 'TASK1_FORM_SUBMITTED', { track });
  return {
    ok: true,
    submission: { fullName: cleanName, maskedEmail: maskPII(cleanEmail), track, auditHash: entry.hash }
  };
}

function startServer(port = process.env.PORT || 3001) {
  const express = require('express');
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, 'public')));
  const { audit } = wireEnterpriseExpress(app, 'task1-html-ssr-express');

  app.get('/', (_req, res) => res.render('index', { title: 'Task 1 — Express SSR Intake Portal (v7.0)' }));
  app.post('/submit', (req, res) => {
    const out = processSubmission(req.body, audit);
    if (!out.ok) return res.status(400).send(out.error);
    return res.render('result', { submission: out.submission });
  });

  return app.listen(port, () => console.log(`[Task 1] SSR Express server running on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { processSubmission, startServer, AuditChain };
