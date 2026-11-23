'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function collectCodeMetrics() {
  let jsCount = 0;
  let totalLines = 0;
  let testFiles = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'outputs'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        jsCount += 1;
        totalLines += fs.readFileSync(full, 'utf8').split('\n').length;
        if (entry.name === 'test.js' || entry.name.includes('.spec.js')) testFiles += 1;
      }
    }
  }
  walk(root);
  return {
    jsAndJsxFiles: jsCount,
    totalCodeLines: totalLines,
    avgLinesPerModule: jsCount ? Math.round(totalLines / jsCount) : 0,
    automatedTestSuites: testFiles
  };
}

const checks = [
  { stage: '1. Maintenance Process (ISO 14764)', weight: 12, passed: exists('governance/MAINTENANCE_PROCESS_ISO_14764.md'), evidence: 'governance/MAINTENANCE_PROCESS_ISO_14764.md' },
  { stage: '2. Governance & Code Ownership', weight: 10, passed: exists('.github/CODEOWNERS') && exists('TRACEABILITY_AND_RISK_MATRIX.md'), evidence: '.github/CODEOWNERS + TRACEABILITY_AND_RISK_MATRIX.md' },
  { stage: '3. Version Control Policy', weight: 12, passed: exists('governance/VERSION_CONTROL_POLICY.md') && exists('.gitignore'), evidence: 'governance/VERSION_CONTROL_POLICY.md' },
  { stage: '4. Code Quality & Security Controls', weight: 12, passed: exists('.eslintrc.json') && exists('SECURITY.md') && exists('shared/policy.rego'), evidence: '.eslintrc.json + SECURITY.md + shared/policy.rego' },
  { stage: '5. Change Control & Impact Analysis', weight: 12, passed: exists('governance/CHANGE_CONTROL_AND_IMPACT_ANALYSIS.md') && exists('.github/PULL_REQUEST_TEMPLATE.md'), evidence: 'CHANGE_CONTROL_AND_IMPACT_ANALYSIS.md + PR template' },
  { stage: '6. Living Documentation & API Spec', weight: 10, passed: exists('openapi/openapi-v7.yaml') && exists('CHANGELOG.md'), evidence: 'openapi/openapi-v7.yaml + CHANGELOG.md' },
  { stage: '7. Measurement & Continuous Scorecard', weight: 10, passed: exists('scripts/run_v7_verification.js') && exists('scripts/run_iso_compliance_scorecard.js'), evidence: 'Automated verification & scorecard scripts' },
  { stage: '8. Operational Readiness & CI/CD', weight: 11, passed: exists('.github/workflows/ci-devsecops-v7.yml') && exists('Dockerfile') && exists('tests/k6_load_benchmark.js'), evidence: 'CI workflow + Node 24 Dockerfile + k6 benchmark' },
  { stage: '9. Compliance, SBOM & EOL Disposal', weight: 11, passed: exists('governance/OPERATIONAL_READINESS_AND_EOL_DISPOSAL.md') && exists('sbom/sbom_cyclonedx_v7.json') && exists('.nvmrc'), evidence: 'EOL Disposal Standard + CycloneDX SBOM + .nvmrc (24)' }
];

const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
const maxScore = checks.reduce((sum, c) => sum + c.weight, 0);
const pct = Math.round((score / maxScore) * 100);
const metrics = collectCodeMetrics();

const report = {
  standard: ['ISO/IEC/IEEE 14764:2022', 'ISO/IEC/IEEE 12207:2026'],
  version: '7.1.0',
  generatedAt: new Date().toISOString(),
  complianceScorePct: pct,
  status: pct >= 90 ? 'COMPLIANT' : 'BELOW_THRESHOLD',
  metrics,
  checks
};

const outDir = path.join(root, 'outputs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'iso_compliance_scorecard.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');

const md = [
  '# Continuous ISO 14764:2022 & ISO 12207:2026 Compliance Scorecard (v7.1)',
  `- **Overall Score:** ${pct}% (${report.status})`,
  `- **Codebase Metrics:** ${metrics.jsAndJsxFiles} JS/JSX modules | ${metrics.totalCodeLines} total lines | avg ${metrics.avgLinesPerModule} lines/module | ${metrics.automatedTestSuites} automated test suites`,
  '',
  '| Stage | Weight | Status | Verified Evidence |',
  '| --- | --- | --- | --- |',
  ...checks.map((c) => `| ${c.stage} | ${c.weight}% | ${c.passed ? 'PASS' : 'FAIL'} | \`${c.evidence}\` |`)
].join('\n') + '\n';

fs.writeFileSync(path.join(outDir, 'iso_compliance_scorecard.md'), md, 'utf8');
console.log(`ISO 14764/12207 Compliance Scorecard: ${pct}% (${report.status}) | ${metrics.jsAndJsxFiles} modules, avg ${metrics.avgLinesPerModule} lines/module`);
if (pct < 90) process.exit(1);
