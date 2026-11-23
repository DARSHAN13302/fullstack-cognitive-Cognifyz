'use strict';
const { maskPII } = require('./enterpriseBootstrap');

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt\s*:/i,
  /drop\s+table\s+/i,
  /<\s*script\b/i,
  /bypass\s+(auth|rbac|policy)/i
];

function cosineSimilarity(a, b) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

function deterministicEmbed(text) {
  const vec = new Array(8).fill(0);
  const clean = String(text || '').toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    vec[i % 8] += (clean.charCodeAt(i) % 31) / 31;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => Number((v / norm).toFixed(4)));
}

class CognitiveDecisionEngine {
  constructor(auditChain = null, options = {}) {
    this.audit = auditChain;
    this.hitlThreshold = options.hitlThreshold ?? 0.85;
    this.workingMemory = new Map();
    this.semanticStore = [
      { id: 'pol-01', text: 'deploy production release requires passing stlc tests and codeql', tags: ['deploy', 'ci'], embedding: deterministicEmbed('deploy production release requires passing stlc tests and codeql') },
      { id: 'pol-02', text: 'refund or delete user data requires admin role and audit log', tags: ['delete', 'admin'], embedding: deterministicEmbed('refund or delete user data requires admin role and audit log') },
      { id: 'pol-03', text: 'read status metrics health report allowed for viewer and engineer', tags: ['read', 'health'], embedding: deterministicEmbed('read status metrics health report allowed for viewer and engineer') }
    ];
  }

  inspectGuardrails(inputText) {
    const raw = String(inputText || '');
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(raw)) {
        return { safe: false, reason: 'OWASP_LLM01_PROMPT_INJECTION_DETECTED', sanitized: maskPII(raw) };
      }
    }
    return { safe: true, reason: 'PASS', sanitized: maskPII(raw) };
  }

  retrieveHybridMemory(query, sessionId = 'default') {
    const qVec = deterministicEmbed(query);
    const ranked = this.semanticStore
      .map((doc) => ({ id: doc.id, text: doc.text, score: Number(cosineSimilarity(qVec, doc.embedding).toFixed(3)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    const sessionHistory = this.workingMemory.get(sessionId) || [];
    return { semanticMatches: ranked, recentTurns: sessionHistory.slice(-3) };
  }

  evaluateSymbolicRules(req) {
    const { role = 'viewer', action = 'read', amount = 0, ciPassed = true } = req;
    if (action === 'delete_database' || action === 'disable_audit') {
      return { allowed: false, ruleId: 'OPA_DENY_DESTRUCTIVE_CORE', reason: 'Destructive core action blocked by symbolic policy.' };
    }
    if (action === 'deploy_prod' && !ciPassed) {
      return { allowed: false, ruleId: 'OPA_REQUIRE_GREEN_CI', reason: 'Production deployment blocked because CI/STLC gates failed.' };
    }
    if (action === 'approve_budget' && amount > 10000 && role !== 'admin') {
      return { allowed: false, ruleId: 'OPA_BUDGET_RBAC', reason: 'Budget approval above 10,000 requires admin role.' };
    }
    return { allowed: true, ruleId: 'OPA_PASS', reason: 'Symbolic invariants satisfied.' };
  }

  decide(request) {
    const { actor = 'anonymous', role = 'viewer', action = 'read', prompt = '', amount = 0, ciPassed = true, sessionId = 'default', confidence = 0.92 } = request || {};

    // Layer 5: Input Guardrail
    const guard = this.inspectGuardrails(prompt);
    if (!guard.safe) {
      const denied = { decision: 'BLOCKED', tier: 'GUARDRAIL', reason: guard.reason, requiresHumanApproval: false };
      if (this.audit) this.audit.append(actor, 'COGNITIVE_BLOCKED', denied);
      return denied;
    }

    // Layer 3A: Tier-1 Deterministic Symbolic Rules (OPA-aligned)
    const symbolic = this.evaluateSymbolicRules({ role, action, amount, ciPassed });
    if (!symbolic.allowed) {
      const denied = { decision: 'DENIED', tier: 'TIER_1_SYMBOLIC', ruleId: symbolic.ruleId, reason: symbolic.reason, requiresHumanApproval: false };
      if (this.audit) this.audit.append(actor, 'COGNITIVE_DENIED', denied);
      return denied;
    }

    // Layer 2: 3-Tier Hybrid Memory Retrieval
    const memory = this.retrieveHybridMemory(`${action} ${guard.sanitized}`, sessionId);

    // Layer 3B + Layer 4: Confidence-Gated HITL Decision
    const highRiskActions = new Set(['deploy_prod', 'delete_record', 'approve_budget', 'rotate_keys']);
    const needsHitl = highRiskActions.has(action) || confidence < this.hitlThreshold;
    const outcome = {
      decision: needsHitl ? 'REQUIRES_HUMAN_APPROVAL' : 'AUTO_APPROVED',
      tier: needsHitl ? 'TIER_4_AGENTIC_HITL' : 'TIER_3_STRUCTURED_AUTO',
      confidence,
      ruleId: symbolic.ruleId,
      sanitizedPrompt: guard.sanitized,
      memoryContext: memory.semanticMatches,
      requiresHumanApproval: needsHitl
    };

    const history = this.workingMemory.get(sessionId) || [];
    history.push({ action, decision: outcome.decision, ts: new Date().toISOString() });
    this.workingMemory.set(sessionId, history.slice(-10));

    if (this.audit) this.audit.append(actor, 'COGNITIVE_DECISION', { action, decision: outcome.decision, confidence });
    return outcome;
  }
}

module.exports = { CognitiveDecisionEngine, deterministicEmbed, cosineSimilarity };
