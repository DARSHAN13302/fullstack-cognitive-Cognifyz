'use strict';
const path = require('path');
const fs = require('fs');
const { wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');

function verifyResponsiveAssets() {
  const html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'public/styles.css'), 'utf8');
  return {
    hasBootstrap: html.includes('bootstrap'),
    hasViewportMeta: html.includes('name="viewport"'),
    hasTransitions: css.includes('transition:'),
    hasMediaQuery: css.includes('@media')
  };
}

function startServer(port = process.env.PORT || 3003) {
  const express = require('express');
  const app = express();
  wireEnterpriseExpress(app, 'task3-responsive-bootstrap-ui');
  app.get('/tokens.css', (_req, res) => res.sendFile(path.join(__dirname, '../shared/tokens.css')));
  app.use(express.static(path.join(__dirname, 'public')));
  return app.listen(port, () => console.log(`[Task 3] Responsive UI server on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { verifyResponsiveAssets, startServer };
