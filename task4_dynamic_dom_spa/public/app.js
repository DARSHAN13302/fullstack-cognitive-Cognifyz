'use strict';
function evaluatePasswordStrength(pw = '') {
  const s = String(pw);
  let score = 0;
  if (s.length >= 12) score += 2;
  else if (s.length >= 8) score += 1;
  if (/[A-Z]/.test(s)) score += 1;
  if (/[a-z]/.test(s)) score += 1;
  if (/\d/.test(s)) score += 1;
  if (/[^A-Za-z0-9]/.test(s)) score += 1;
  const label = score >= 6 ? 'Strong' : score >= 4 ? 'Moderate' : 'Weak';
  return { score, max: 6, label, valid: score >= 5 };
}

function resolveRoute(hash = '#/register') {
  const routes = { '#/register': 'Register & Password Entropy', '#/security': 'Security Policy View', '#/status': 'Live SPA Telemetry' };
  return { route: routes[hash] ? hash : '#/register', title: routes[hash] || routes['#/register'] };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const render = () => {
    const view = document.getElementById('view');
    const r = resolveRoute(window.location.hash);
    if (r.route === '#/register') {
      view.innerHTML = `<h2>${r.title}</h2><label for="pw">Password</label><input id="pw" type="password" style="width:100%;padding:0.5rem;" /><div class="meter"><div id="fill" class="meter-fill"></div></div><p id="pwMsg"></p>`;
      document.getElementById('pw').addEventListener('input', (e) => {
        const res = evaluatePasswordStrength(e.target.value);
        document.getElementById('fill').style.width = `${Math.round((res.score / res.max) * 100)}%`;
        document.getElementById('pwMsg').textContent = `Strength: ${res.label} (${res.score}/${res.max})`;
      });
    } else {
      view.innerHTML = `<h2>${r.title}</h2><p>Client-side route rendered dynamically without full page reload.</p>`;
    }
  };
  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', render);
}

if (typeof module !== 'undefined') module.exports = { evaluatePasswordStrength, resolveRoute };
