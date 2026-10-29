import { writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import { browserSession } from './browser.mjs';
const frameworks = ['react', 'angular', 'vue', 'svelte'];
const cases = ['render100', 'render500', 'render1000', 'update50', 'delete50'];
const session = await browserSession();
try {
  const results = { timestamp: new Date().toISOString(), source: 'Recorded local Chromium benchmark', samples: 10, warmups: 3,
    browser: await session.browser.version(), environment: { os: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0].model, logicalCPUs: os.cpus().length, ramGiB: +(os.totalmem() / 2 ** 30).toFixed(1), viewport: '1100x650', headless: true },
    versions: { react: '19.1.1', angular: '20.3.34', vue: '3.5.44', svelte: '5.57.3' }, frameworks: {}, memory: {}, order: [] };
  // Reproducible Fisher–Yates order; retain the seed and executed order.
  let seed = 20261029; results.orderSeed = seed;
  const order = [...frameworks];
  for (let i = order.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  results.order = order;
  for (const framework of order) {
    const page = await session.browser.newPage({ viewport: { width: 1100, height: 650 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:4173/${framework}.html`); await page.waitForFunction(() => Boolean(window.bench));
    results.frameworks[framework] = await page.evaluate(async () => { const { runFramework } = await import('/runner.js'); return runFramework(window); });
    const cdp = await page.context().newCDPSession(page); await cdp.send('HeapProfiler.enable');
    await page.evaluate(() => window.bench.replace([])); await cdp.send('HeapProfiler.collectGarbage');
    const before = await cdp.send('Runtime.getHeapUsage');
    await page.evaluate(async () => { const { makeTasks } = await import('/runner.js'); await window.bench.replace(makeTasks(1000)); window.bench.layout(); });
    await cdp.send('HeapProfiler.collectGarbage'); const after = await cdp.send('Runtime.getHeapUsage');
    results.memory[framework] = { before: before.usedSize, after: after.usedSize, delta: after.usedSize - before.usedSize };
    if (errors.length) throw new Error(`${framework}: ${errors.join('; ')}`);
    console.log(`${framework}: ${cases.map(c => `${c} ${results.frameworks[framework][c].median.toFixed(2)}ms`).join(' | ')}`);
    await page.close();
  }
  await mkdir('results', { recursive: true });
  const json = JSON.stringify(results, null, 2) + '\n';
  await writeFile('results/benchmark.json', json); await writeFile('public/results.json', json); await writeFile('dist/results.json', json);
  const header = '| Framework | Render 100 | Render 500 | Render 1,000 | Update 50 | Delete 50 | Heap delta, 1,000 |\n|---|---:|---:|---:|---:|---:|---:|';
  const table = header + '\n' + frameworks.map(f => `| ${f} | ${cases.map(c => `${results.frameworks[f][c].median.toFixed(2)} ms`).join(' | ')} | ${(results.memory[f].delta / 1048576).toFixed(2)} MiB |`).join('\n');
  await writeFile('results/RESULTS.md', `# Measured benchmark results\n\n${results.timestamp}\n\n${table}\n\nMedian of 10 samples after 3 warm-ups per case. Updates and deletions begin with 1,000 tasks. Time includes framework commit and forced layout; excludes startup, paint and fixture construction.\n\nBrowser: ${results.browser}, headless. OS: ${results.environment.os}. CPU: ${results.environment.cpu}. RAM: ${results.environment.ramGiB} GiB. Viewport: 1,100 × 650. Order: ${order.join(', ')} (seed ${results.orderSeed}). No CPU throttling.\n\nMemory is a single post-GC JavaScript heap delta between an empty app and 1,000 rows, collected after timings with CDP; it excludes most native DOM and process memory. It is not a repeated statistical estimate.\n\nAngular uses production-mode JIT, compiled before timing, explicit change detection and ngModel. Other apps use production bundles and their documented commit APIs. These are equivalent user-facing workloads, not identical framework internals or a universal ranking. Re-run locally and inspect the raw samples in benchmark.json before drawing conclusions.\n`);
  const winner = c => frameworks.reduce((a,b) => results.frameworks[a][c].median <= results.frameworks[b][c].median ? a : b);
  const reflection = `The hardest part of this exercise was defining a fair stopping point for a DOM operation. Measuring only the state assignment misses deferred rendering. I used each framework's commit mechanism and then forced layout, so the clock includes the work needed to make the updated list measurable. Task generation, baseline resets, and DOM verification happen outside the timer. Stable IDs preserve row identity across updates and deletions.\n\nReact's component state and reconciliation make list changes straightforward, but an explicit flush is needed for this synchronous measurement boundary. Vue combines reactive state with nextTick, while Svelte's compiled updates use tick to signal completion. Angular uses ngFor, ngIf, ngModel, and explicit change detection. Its form controls perform additional bookkeeping, and its templates are JIT-compiled before measurement. That implementation choice limits comparisons with optimized AOT Angular applications.\n\nOn this machine, ${winner('render100')} had the lowest median for rendering 100 tasks, ${winner('render500')} for 500, and ${winner('render1000')} for 1,000. For operations starting with 1,000 tasks, ${winner('update50')} was fastest at updating 50 rows and ${winner('delete50')} at deleting 50. These outcomes are consistent with differences in reconciliation, reactive bookkeeping, and DOM scheduling, but this experiment cannot isolate those causes.\n\nThree warm-ups and ten measured samples reduce startup noise without eliminating garbage collection or operating-system interference. Memory deltas describe JavaScript heap growth rather than total browser memory. I would repeat the experiment across browsers and devices, rotate the framework order, and compare AOT Angular and alternative state patterns before choosing a framework on performance alone.`;
  await writeFile('REFLECTION.md', '# Reflection report\n\n' + reflection + '\n');
  await writeFile('public/reflection.txt', reflection); await writeFile('dist/reflection.txt', reflection);
  console.log(`Saved raw samples, comparison table, and ${reflection.split(/\s+/).length}-word reflection.`);
} finally { await session.close(); }
