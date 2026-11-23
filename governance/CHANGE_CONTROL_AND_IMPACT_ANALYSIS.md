# Change Control & Change Impact Analysis (CIA) Procedure

Every non-trivial change must complete a structured Change Impact Analysis before merge:
1. **Change Classification:** Standard (pre-approved Dependabot/docs), Normal (PR + CIA review), Emergency (P1 hotfix + post-hoc CAB review within 24h).
2. **Blast-Radius Assessment:** Identify affected tasks (`task1`–`task8`), shared modules (`enterpriseBootstrap.js`, `cognitiveDecisionEngine.js`), database schemas (`schema.sql`), and external OpenAPI contracts (`openapi-v7.yaml`).
3. **Security & Privacy Impact:** Evaluate OWASP Top 10 / OWASP LLM Top 10 exposure, PII masking changes, and OPA `policy.rego` invariants.
4. **Rollback & Verification Criteria:** Document exact revert command or feature-flag kill switch and require passing STLC + compliance scorecard runs.
