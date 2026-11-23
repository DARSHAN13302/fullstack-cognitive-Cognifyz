'use strict';
const path = require('path');
const { wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');

function startServer(port = process.env.PORT || 3004) {
  const express = require('express');
  const app = express();
  wireEnterpriseExpress(app, 'task4-dynamic-dom-spa');
  app.use(express.static(path.join(__dirname, 'public')));
  return app.listen(port, () => console.log(`[Task 4] Dynamic DOM SPA server on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { startServer };
