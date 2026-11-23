# Bug / Defect Life Cycle Log (v7.0)

| Defect ID | Task / Module | Severity | State | Summary | Resolution |
| --- | --- | --- | --- | --- | --- |
| DEF-001 | Runtime / CI | Critical | Closed | Node.js v18 reached EOL (Apr 2025) | Upgraded `.nvmrc`, `Dockerfile`, and CI to Node.js 24 LTS |
| DEF-002 | Task 5 Frontend | High | Closed | Missing React/Angular UI from onboarding spec | Added React 18 + Vite `App.jsx` consuming Task 5 REST API |
| DEF-003 | Task 6 Auth | High | Closed | JWT logout lacked server-side revocation | Added JTI revocation registry (`revokeJwt`) + STLC test |
