'use strict';
const path = require('path');
const { AuditChain, wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');

class ItemRepository {
  constructor() {
    this.items = [{ id: 1, title: 'Configure Node 24 LTS CI', status: 'done' }];
    this.nextId = 2;
  }
  list() { return this.items; }
  create(title, status = 'open') {
    const clean = String(title || '').trim();
    if (clean.length < 2) return null;
    const item = { id: this.nextId++, title: clean, status };
    this.items.push(item);
    return item;
  }
  update(id, patch = {}) {
    const item = this.items.find((x) => x.id === Number(id));
    if (!item) return null;
    if (patch.title) item.title = String(patch.title).trim();
    if (patch.status) item.status = String(patch.status).trim();
    return item;
  }
  remove(id) {
    const idx = this.items.findIndex((x) => x.id === Number(id));
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }
}

function startServer(port = process.env.PORT || 3005) {
  const express = require('express');
  const cors = require('cors');
  const app = express();
  const repo = new ItemRepository();
  app.use(cors());
  app.use(express.json());
  const { audit } = wireEnterpriseExpress(app, 'task5-rest-api-react-frontend');
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/items', (_req, res) => res.json({ items: repo.list() }));
  app.post('/api/items', (req, res) => {
    const created = repo.create(req.body.title, req.body.status);
    if (!created) return res.status(400).json({ error: 'Title (>=2 chars) required' });
    audit.append('api-client', 'TASK5_ITEM_CREATED', { id: created.id });
    return res.status(201).json(created);
  });
  app.put('/api/items/:id', (req, res) => {
    const updated = repo.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json(updated);
  });
  app.delete('/api/items/:id', (req, res) => {
    if (!repo.remove(req.params.id)) return res.status(404).json({ error: 'Item not found' });
    return res.status(204).end();
  });

  return app.listen(port, () => console.log(`[Task 5] REST CRUD API running on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { ItemRepository, startServer, AuditChain };
