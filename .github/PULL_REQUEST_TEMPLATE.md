## Change Summary
- **Maintenance Category (ISO 14764):** [ ] Corrective  [ ] Adaptive  [ ] Perfective  [ ] Preventive  [ ] New Feature
- **Linked Issue / Defect ID:**

## Change Impact Analysis (CIA)
- **Affected Modules / Tasks:**
- **API or DB Schema Breaking Change?** [ ] No  [ ] Yes (reversible migration attached)
- **Security / PII / OPA Policy Impact:** [ ] None  [ ] Reviewed (details below)
- **Rollback Plan:** (e.g. `git revert <sha>` / Render previous release)

## Verification Checklist
- [ ] `node scripts/run_v7_verification.js` passed
- [ ] `node scripts/run_iso_compliance_scorecard.js` scored >= 90%
- [ ] `python3 shared/mcp_tools_server.py --self-test` passed
- [ ] `CHANGELOG.md` and `openapi/openapi-v7.yaml` updated if applicable
