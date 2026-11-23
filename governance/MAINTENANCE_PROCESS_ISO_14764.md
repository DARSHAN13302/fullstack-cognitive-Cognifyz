# Software Maintenance Process Standard (ISO/IEC/IEEE 14764:2022)

## 1. Scope & Business Alignment
Defines mandatory workflows, roles, and SLAs for maintaining Tasks 1–8 and shared enterprise/cognitive modules from General Availability through End-of-Life.

## 2. Four Mandatory Maintenance Categories
| Maintenance Type | Trigger | Target SLA | Required Verification |
| --- | --- | --- | --- |
| **Corrective** | Production bug, P1/P2 incident, security CVE | P1: 4h, P2: 24h, P3: 5d | Regression STLC test + root-cause entry in `DEFECT_LOG.md` |
| **Adaptive** | OS/runtime/API/regulatory shift (e.g., Node 24 LTS, DPDP Rules) | Planned sprint / 30d pre-EOL | Full `run_v7_verification.js` + contract & schema checks |
| **Perfective** | Performance tuning, UX/WCAG polish, query/cache optimization | Quarterly / Roadmap | `k6` latency check + Lighthouse/a11y verification |
| **Preventive** | Refactoring tech debt, dependency bumps, key rotation, DR drills | Weekly (Dependabot) / Monthly | CodeQL 0 high alerts + `run_iso_compliance_scorecard.js` >= 90% |

## 3. Governance Roles
- **Maintainer / Code Owner:** Reviews PRs per `.github/CODEOWNERS` and signs release tags.
- **Security Reviewer:** Approves changes touching `shared/`, auth, crypto, or `policy.rego`.
- **Release Manager / SRE:** Verifies CI scorecard, staging smoke test, and rollback readiness.
