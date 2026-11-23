# Version Control Governance Policy (v7.1)

## 1. Branching Strategy (Trunk-Based / Short-Lived Feature Branches)
- `main` is always deployable and protected (no direct pushes, no force-pushes).
- Branch naming: `feat/<ticket>-<slug>`, `fix/<defect-id>-<slug>`, `chore/<scope>`, `hotfix/<cve-or-p1>`.
- Maximum branch lifetime: 5 business days to prevent merge drift.

## 2. Commit, Merge & Signing Rules
- Enforce **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `sec:`).
- Squash-merge feature branches into `main` only after: (a) green `ci-devsecops-v7.yml`, (b) compliance scorecard >= 90%, (c) >= 1 `CODEOWNERS` approval.
- Commit signing (SSH or GPG) required for all release tags.

## 3. Tagging, Release & Retention Rules
- Tag releases using Semantic Versioning (`vMAJOR.MINOR.PATCH`, e.g., `v7.1.0`).
- Auto-delete merged feature branches; retain release tags and `sbom_cyclonedx_v7.json` artifacts indefinitely for audit traceability.
