'use strict';
const crypto = require('crypto');

const I18N = {
  en: { healthy: 'Service operational', unauthorized: 'Unauthorized access', forbidden: 'Insufficient role privileges' },
  hi: { healthy: 'सेवा सक्रिय है', unauthorized: 'अनधिकृत प्रवेश', forbidden: 'अपर्याप्त अनुमतियाँ' },
  kn: { healthy: 'ಸೇವೆ ಸಕ್ರಿಯವಾಗಿದೆ', unauthorized: 'ಅನಧಿಕೃತ ಪ್ರವೇಶ', forbidden: 'ಅಸಮರ್ಪಕ ಅನುಮತಿಗಳು' },
  es: { healthy: 'Servicio operativo', unauthorized: 'Acceso no autorizado', forbidden: 'Privilegios insuficientes' }
};

function maskPII(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1***$2')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 'XXXX-XXXX-****')
    .replace(/\b(\+?\d{1,3}[-.\s]?)?\d{6}(\d{4})\b/g, '******$2');
}

function generateTraceparent() {
  const traceId = crypto.randomBytes(16).toString('hex');
  const spanId = crypto.randomBytes(8).toString('hex');
  return `00-${traceId}-${spanId}-01`;
}

class AuditChain {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.entries = [];
  }

  append(actor, action, details = {}) {
    const prevHash = this.entries.length ? this.entries[this.entries.length - 1].hash : '0'.repeat(64);
    const timestamp = new Date().toISOString();
    const sanitized = JSON.parse(JSON.stringify(details, (_, v) => (typeof v === 'string' ? maskPII(v) : v)));
    const payload = JSON.stringify({ index: this.entries.length, service: this.serviceName, timestamp, actor: maskPII(String(actor)), action, details: sanitized, prevHash });
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    const entry = { index: this.entries.length, service: this.serviceName, timestamp, actor: maskPII(String(actor)), action, details: sanitized, prevHash, hash };
    this.entries.push(entry);
    return entry;
  }

  verify() {
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i];
      const expectedPrev = i === 0 ? '0'.repeat(64) : this.entries[i - 1].hash;
      if (e.prevHash !== expectedPrev) return { valid: false, brokenAt: i };
      const payload = JSON.stringify({ index: e.index, service: e.service, timestamp: e.timestamp, actor: e.actor, action: e.action, details: e.details, prevHash: e.prevHash });
      const recomputed = crypto.createHash('sha256').update(payload).digest('hex');
      if (recomputed !== e.hash) return { valid: false, brokenAt: i };
    }
    return { valid: true, length: this.entries.length };
  }
}

function createMetricsCollector(serviceName) {
  const stats = { requestsTotal: 0, errorsTotal: 0, startTime: Date.now() };
  return {
    record(statusCode) {
      stats.requestsTotal += 1;
      if (statusCode >= 400) stats.errorsTotal += 1;
    },
    renderPrometheus() {
      const uptimeSec = Math.floor((Date.now() - stats.startTime) / 1000);
      return [
        `# HELP app_requests_total Total HTTP requests handled`,
        `# TYPE app_requests_total counter`,
        `app_requests_total{service="${serviceName}"} ${stats.requestsTotal}`,
        `# HELP app_errors_total Total HTTP 4xx/5xx responses`,
        `# TYPE app_errors_total counter`,
        `app_errors_total{service="${serviceName}"} ${stats.errorsTotal}`,
        `# HELP app_uptime_seconds Process uptime in seconds`,
        `# TYPE app_uptime_seconds gauge`,
        `app_uptime_seconds{service="${serviceName}"} ${uptimeSec}`
      ].join('\n') + '\n';
    }
  };
}

function applySecurityHeaders(res, traceparent) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net");
  res.setHeader('traceparent', traceparent || generateTraceparent());
}

function wireEnterpriseExpress(app, serviceName) {
  const audit = new AuditChain(serviceName);
  const metrics = createMetricsCollector(serviceName);

  app.use((req, res, next) => {
    const tp = req.headers['traceparent'] || generateTraceparent();
    req.traceparent = tp;
    applySecurityHeaders(res, tp);
    res.on('finish', () => metrics.record(res.statusCode));
    next();
  });

  app.get('/health', (req, res) => {
    const lang = (req.query.lang || 'en').slice(0, 2);
    const t = I18N[lang] || I18N.en;
    res.json({ status: 'ok', service: serviceName, version: '7.0.0', message: t.healthy, traceparent: req.traceparent, node: process.version });
  });

  app.get('/metrics', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.renderPrometheus());
  });

  app.get('/audit/verify', (_req, res) => {
    res.json({ service: serviceName, ...audit.verify() });
  });

  return { audit, metrics };
}

module.exports = { I18N, maskPII, generateTraceparent, AuditChain, createMetricsCollector, applySecurityHeaders, wireEnterpriseExpress };
