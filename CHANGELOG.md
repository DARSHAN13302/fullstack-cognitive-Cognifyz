# Changelog
## [7.2.0] - 2026-11-23
- Added unified zero-dependency HTTP Gateway (`gateway/server.js` + `gateway/public/index.html`) routing all 8 tasks behind one port (`3000`).
- Added live TCP/HTTP End-to-End integration test suite (`tests/run_live_http_e2e.js`) capturing verified HTTP logs into `outputs/live_http_e2e_report.txt`.
- Added one-click Render IaC deployment blueprint (`render.yaml`) pinned to Node.js 24 LTS.

## [7.1.0] - 2026-11-23
- Closed all 9 ISO/IEC/IEEE 14764:2022 & ISO/IEC/IEEE 12207:2026 maintenance and version-control governance gaps.
- Added `governance/MAINTENANCE_PROCESS_ISO_14764.md`, `governance/VERSION_CONTROL_POLICY.md`, `governance/CHANGE_CONTROL_AND_IMPACT_ANALYSIS.md`, `governance/OPERATIONAL_READINESS_AND_EOL_DISPOSAL.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and `.eslintrc.json`.
- Added executable continuous compliance scorecard (`scripts/run_iso_compliance_scorecard.js`) emitting `outputs/iso_compliance_scorecard.json` & `.md`, wired into GitHub Actions CI.

## [7.0.0] - 2026-11-23
- Added `shared/cognitiveDecisionEngine.js` (neuro-symbolic decision router, OWASP LLM01 guardrail, 3-tier hybrid memory, HITL gate).
- Added `shared/mcp_tools_server.py` (Python 3 MCP JSON-RPC 2.0 tool server) and `shared/policy.rego` (OPA policy).
- Added React 18 + Vite frontend (`task5_rest_api_react_frontend/frontend/src/App.jsx`).
- Upgraded target runtime to Node.js 24 LTS (`.nvmrc`, `Dockerfile`, GitHub Actions CI + CodeQL + Dependabot).
- Added Defect Life Cycle, Release Process, ALM Traceability Matrix, Playwright E2E/a11y spec, and k6 load benchmark.
