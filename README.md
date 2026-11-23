# Full-Stack Cognitive Engineering Suite (v7.0 — Tasks 1 to 8)

Complete, production-hardened v7.0 software package closing all audited gaps from v6.0 and adding a Neuro-Symbolic Cognitive Decision Layer (`shared/cognitiveDecisionEngine.js`), Python MCP Tool Server (`shared/mcp_tools_server.py`), OPA Rego Policy (`shared/policy.rego`), React 18 + Vite frontend (`task5_rest_api_react_frontend/frontend/`), Node.js 24 LTS target, Defect/Release/ALM governance docs, and captured verification output logs (`outputs/v7_verification_report.txt`).

## Quick Verification
```bash
node scripts/run_v7_verification.js
python3 shared/mcp_tools_server.py --self-test
```
