# Windows 11 PowerShell Setup & Verification Helper for Full-Stack Cognitive v7.0
$ErrorActionPreference = "Stop"
Write-Host "Checking Node.js & Python versions..." -ForegroundColor Cyan
node -v
python --version
Write-Host "Running v7.0 automated verification suite..." -ForegroundColor Cyan
node scripts/run_v7_verification.js
python shared/mcp_tools_server.py --self-test
Write-Host "Initializing Git repository if not present..." -ForegroundColor Cyan
if (-not (Test-Path ".git")) {
  git init
  git add .
  git commit -m "feat: release Full-Stack Cognitive v7.0 (Tasks 1-8 + React + MCP + OPA)"
}
Write-Host "Done! Run 'npm install' inside any task folder and 'npm start' to launch locally." -ForegroundColor Green
