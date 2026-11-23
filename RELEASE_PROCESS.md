# Software Release Life Cycle (Pre-Alpha -> GA)
1. **Pre-Alpha:** Local feature branch, unit tests green.
2. **Alpha (`v7.0.0-alpha.1`):** All 8 per-task STLC suites pass via `node scripts/run_v7_verification.js`.
3. **Beta (`v7.0.0-beta.1`):** Live staging deployment on Render + Playwright E2E + OWASP ZAP baseline scan.
4. **Release Candidate (`v7.0.0-rc.1`):** CodeQL 0 high alerts, CycloneDX SBOM attached, DB backup/restore verified.
5. **General Availability (`v7.0.0`):** Signed Git tag, GitHub Release published, `CHANGELOG.md` finalized.
