'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jsFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'outputs') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js') && !full.includes('vite.config.js') && !full.includes('k6_load_benchmark.js')) jsFiles.push(full);
  }
}
walk(root);

const lines = [];
lines.push(`=== Full-Stack Cognitive v7.0 Verification Output ===`);
lines.push(`Timestamp: ${new Date().toISOString()}`);
lines.push(`Node Runtime: ${process.version}`);

// 1. Syntax check all CommonJS files
for (const f of jsFiles) {
  execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
}
lines.push(`[PASS] Syntax verified: ${jsFiles.length}/${jsFiles.length} JS modules`);

// 2. Lightweight SAST check (no eval, no hardcoded AWS/GitHub tokens)
let sastFindings = 0;
for (const f of jsFiles) {
  if (f.endsWith('run_v7_verification.js')) continue;
  const txt = fs.readFileSync(f, 'utf8');
  if (/\beval\s*\(/.test(txt) || /AKIA[0-9A-Z]{16}/.test(txt) || /ghp_[A-Za-z0-9]{20,}/.test(txt)) {
    sastFindings += 1;
    lines.push(`[FAIL] SAST finding in ${path.relative(root, f)}`);
  }
}
if (sastFindings > 0) process.exit(1);
lines.push(`[PASS] Static SAST scan: 0 findings across ${jsFiles.length} files`);

// 3. Execute all 8 per-task STLC test suites
const tasks = [
  'task1_html_ssr_express/test.js',
  'task2_validation_storage/test.js',
  'task3_responsive_bootstrap_ui/test.js',
  'task4_dynamic_dom_spa/test.js',
  'task5_rest_api_react_frontend/test.js',
  'task6_database_jwt_rbac/test.js',
  'task7_oauth_external_api_ratelimit/test.js',
  'task8_redis_queue_cache_cognitive/test.js'
];
for (const t of tasks) {
  const out = execFileSync(process.execPath, [path.join(root, t)], { encoding: 'utf8' }).trim();
  lines.push(`[PASS] ${out}`);
}

// 4. Write captured output file into outputs/
const outDir = path.join(root, 'outputs');
fs.mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, 'v7_verification_report.txt');
fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
console.log(lines.join('\n'));
