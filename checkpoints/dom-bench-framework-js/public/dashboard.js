import { frameworks, labels, cases, makeTasks, waitForApp, runFramework } from './runner.js';
const $ = selector => document.querySelector(selector);
const descriptions = { react: ['⚛', 'Component-based. State-driven.', 'Virtual DOM reconciliation'], angular: ['A', 'Structured. Powerful. Complete.', 'Directives & change detection'], vue: ['V', 'Approachable. Reactive. Flexible.', 'Reactive DOM updates'], svelte: ['S', 'Compiled. Lean. Direct.', 'Compile-time DOM updates'] };
const versions = { react: '19.1.1', angular: '20.3.34', vue: '3.5.44', svelte: '5.57.3' };
let results = null;
let activeFramework = 'react';
let running = false;
let hasLocalResults = false;
let generation = 0;
$('#framework-cards').innerHTML = frameworks.map(f => `<a href="#playground" class="framework-card" data-open-framework="${f}"><div class="framework-icon ${f}">${descriptions[f][0]}</div><span class="version-tag">v${versions[f]}</span><h3>${labels[f]}</h3><p>${descriptions[f][1]}</p><div class="framework-card-bottom"><span>${descriptions[f][2]}</span><span>↗</span></div></a>`).join('');
function status(text, error = false) { $('#status').hidden = !text; $('#status').textContent = text; $('#status').classList.toggle('error', error); }
function render() {
  const data = results?.frameworks;
  for (const [name, key] of [['render', 'render1000'], ['update', 'update50'], ['delete', 'delete50']]) {
    if (!data) continue;
    const winner = [...frameworks].sort((a,b) => data[a][key].median - data[b][key].median)[0];
    $(`#${name}-winner`).textContent = labels[winner];
    $(`#${name}-note`).innerHTML = `<strong>${data[winner][key].median.toFixed(2)} ms</strong> · ${name === 'render' ? '1,000 tasks' : '50 tasks'}`;
  }
  const key = $('#chart-operation').value;
  if (data) {
    const maximum = Math.max(0.1, ...frameworks.map(f => data[f][key].median)) * 1.15;
    $('#chart').innerHTML = frameworks.map(f => `<div class="chart-row"><div class="chart-row-label"><i class="dot ${f}"></i>${labels[f]}</div><div class="bar-track"><div class="bar ${f}" style="width:${data[f][key].median / maximum * 100}%"></div></div><div class="chart-time">${data[f][key].median.toFixed(2)} ms</div></div>`).join('') + `<div class="chart-axis">${[0,1,2,3,4].map(i=>`<span>${(maximum * i / 4).toFixed(1)}${i === 4 ? ' ms' : ''}</span>`).join('')}</div>`;
  }
  $('#results-body').innerHTML = frameworks.map(f => `<tr><td><i class="dot ${f}"></i>${labels[f]}</td>${cases.map(test => {
    const value = data?.[f]?.[test.key]?.median;
    const best = data && value === Math.min(...frameworks.map(name => data[name][test.key].median));
    return `<td class="${best ? 'best-cell' : ''}">${value === undefined ? '—' : value.toFixed(2) + ' ms'}</td>`;
  }).join('')}</tr>`).join('');
  if (results) $('#results-meta').textContent = `${results.source} · ${new Date(results.timestamp).toLocaleString()} · ${results.samples} samples + ${results.warmups} warm-ups · Updates and deletions start with 1,000 tasks`;
  $('#memory-results').replaceChildren();
  if (results?.memory) {
    const wrap = document.createElement('div'); wrap.className = 'memory-items';
    for (const f of frameworks) { const el = document.createElement('div'); el.className = 'memory-item'; el.textContent = `${labels[f]}: ${(results.memory[f].delta / 1048576).toFixed(2)} MiB heap increase`; wrap.append(el); }
    $('#memory-results').append(wrap);
  }
}
function view() {
  const name = ['playground', 'results'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  for (const v of ['overview', 'playground', 'results']) $(`#${v}-view`).hidden = v !== name;
  document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === name));
  const titles = { overview: ['Small tasks. <span>Big differences.</span>', 'Explore how your favorite frameworks handle the everyday work of the DOM.', 'Overview'], playground: ['A little list. <span>A lot to explore.</span>', 'Get hands-on with the same to-do app, built four different ways.', 'Task playground'], results: ['Real runs. <span>Real perspective.</span>', 'Explore measured results for every operation and framework.', 'Benchmark results'] };
  $('#page-title').innerHTML = titles[name][0]; $('#page-description').textContent = titles[name][1]; $('#breadcrumb-current').textContent = titles[name][2];
}
function selectFramework(f) {
  if (f === activeFramework) return;
  activeFramework = f; generation++;
  $('#playground').src = `/${f}.html`; $('#playground').title = `${labels[f]} to-do application`;
  $('#active-framework-label').textContent = labels[f].toUpperCase(); $('#standalone-link').href = `/${f}.html`;
  document.querySelectorAll('[data-framework]').forEach(button => button.classList.toggle('selected', button.dataset.framework === f));
}
document.querySelectorAll('[data-framework]').forEach(el => el.addEventListener('click', () => selectFramework(el.dataset.framework)));
document.querySelectorAll('[data-open-framework]').forEach(el => el.addEventListener('click', () => selectFramework(el.dataset.openFramework)));
window.addEventListener('hashchange', view); view();
$('#chart-operation').addEventListener('change', render);
for (const [selector, getTasks] of [['#seed-tasks', () => makeTasks(Number($('#task-count').value))], ['#clear-tasks', () => []]]) {
  $(selector).addEventListener('click', async () => { const current = generation; try { await waitForApp($('#playground')); if (current !== generation) return; await $('#playground').contentWindow.bench.replace(getTasks()); status(''); } catch (error) { status(error.message, true); } });
}
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => $(`#${button.dataset.dialog}`).showModal()));
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog && (e.offsetX < 0 || e.offsetY < 0 || e.offsetX > dialog.clientWidth || e.offsetY > dialog.clientHeight)) dialog.close(); }));
$('.run-button').addEventListener('click', async () => {
  if (running) return;
  running = true; $('.run-button').disabled = true; $('.run-button').textContent = 'Running the lab…';
  const data = { timestamp: new Date().toISOString(), source: 'Measured in your browser', samples: 10, warmups: 3, browser: navigator.userAgent, frameworks: {} };
  try {
    for (let i = 0; i < frameworks.length; i++) {
      const f = frameworks[i];
      status(`Testing ${labels[f]} (${i + 1}/4)… Keep this tab active for consistent results.`);
      const frame = document.createElement('iframe'); frame.src = `/${f}.html`; frame.title = `${labels[f]} benchmark`;
      $('#benchmark-host').replaceChildren(frame); await waitForApp(frame);
      data.frameworks[f] = await runFramework(frame.contentWindow, { progress: key => status(`Testing ${labels[f]} (${i + 1}/4) · ${cases.find(c => c.key === key).label} complete…`) });
    }
    results = data; hasLocalResults = true; render();
    try { localStorage.setItem('dom-bench-results-v1', JSON.stringify(data)); } catch { /* Storage is optional. */ }
    status('Benchmark complete. All DOM checks passed. Explore the results or export your measurements.');
  } catch (error) { status(`Benchmark stopped: ${error.message}`, true); }
  finally { $('#benchmark-host').replaceChildren(); running = false; $('.run-button').disabled = false; $('.run-button').innerHTML = '<span class="play-icon">▷</span> Run benchmarks <span>↗</span>'; }
});
$('.export-button').addEventListener('click', () => {
  if (!results) { status('Run the benchmarks first to export measurements.'); return; }
  const lines = [['framework', 'operation', 'median_ms', 'min_ms', 'max_ms', 'samples_ms', 'timestamp', 'source']];
  for (const f of frameworks) for (const test of cases) { const r = results.frameworks[f][test.key]; lines.push([labels[f], test.key, r.median, r.min, r.max, r.samples.join(';'), results.timestamp, results.source]); }
  const csv = lines.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'dom-bench-results.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
try { const saved = JSON.parse(localStorage.getItem('dom-bench-results-v1')); if (saved && frameworks.every(f => cases.every(c => Number.isFinite(saved.frameworks?.[f]?.[c.key]?.median)))) { results = saved; hasLocalResults = true; render(); } } catch { /* Ignore unavailable storage or stale results. */ }
fetch('/results.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { if (!hasLocalResults && !running) { results = data; render(); } }).catch(() => {});
fetch('/reflection.txt').then(r => r.ok ? r.text() : '').then(text => { if (text.trim()) { $('#reflection-content').replaceChildren(...text.trim().split(/\n\s*\n/).map(paragraph => { const p = document.createElement('p'); p.textContent = paragraph; return p; })); } }).catch(() => {});
