'use strict';
const crypto = require('crypto');
const { AuditChain, wireEnterpriseExpress } = require('../shared/enterpriseBootstrap');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production-env';
const revokedJtis = new Set();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

function signJwt(payload, ttlSec = 900) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, jti: crypto.randomUUID(), iat: now, exp: now + ttlSec })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return { valid: false, error: 'MALFORMED_TOKEN' };
  const [h, b, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64url');
  if (sig !== expected) return { valid: false, error: 'INVALID_SIGNATURE' };
  const claims = JSON.parse(Buffer.from(b, 'base64url').toString('utf8'));
  if (claims.exp < Math.floor(Date.now() / 1000)) return { valid: false, error: 'TOKEN_EXPIRED' };
  if (revokedJtis.has(claims.jti)) return { valid: false, error: 'TOKEN_REVOKED' };
  return { valid: true, claims };
}

function revokeJwt(jti) { revokedJtis.add(jti); }

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const auth = req.headers.authorization || '';
    const check = verifyJwt(auth.replace(/^Bearer\s+/i, ''));
    if (!check.valid) return res.status(401).json({ error: check.error });
    if (!allowedRoles.includes(check.claims.role)) return res.status(403).json({ error: 'FORBIDDEN_ROLE' });
    req.user = check.claims;
    return next();
  };
}

function startServer(port = process.env.PORT || 3006) {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const { audit } = wireEnterpriseExpress(app, 'task6-database-jwt-rbac');
  const users = new Map();

  app.post('/api/auth/register', (req, res) => {
    const { email, password, role = 'viewer' } = req.body || {};
    if (!email || !password || password.length < 8) return res.status(400).json({ error: 'Email and password (>=8 chars) required' });
    users.set(email, { email, passwordHash: hashPassword(password), role });
    audit.append(email, 'TASK6_USER_REGISTERED', { role });
    return res.status(201).json({ registered: true, role });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const u = users.get(email);
    if (!u || !verifyPassword(password, u.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signJwt({ sub: u.email, role: u.role });
    return res.json({ token });
  });

  app.post('/api/auth/logout', requireRole(['viewer', 'engineer', 'admin']), (req, res) => {
    revokeJwt(req.user.jti);
    audit.append(req.user.sub, 'TASK6_TOKEN_REVOKED', { jti: req.user.jti });
    return res.json({ revoked: true });
  });

  app.get('/api/admin/audit', requireRole(['admin']), (_req, res) => res.json({ audit: audit.verify() }));
  return app.listen(port, () => console.log(`[Task 6] DB + JWT/RBAC server on http://localhost:${port}`));
}

if (require.main === module) startServer();
module.exports = { hashPassword, verifyPassword, signJwt, verifyJwt, revokeJwt, requireRole, startServer, AuditChain };
