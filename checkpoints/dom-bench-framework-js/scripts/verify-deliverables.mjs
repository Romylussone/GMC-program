import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');
const pkg = JSON.parse(await read('package.json'));
const raw = await read('results/benchmark.json');
const results = JSON.parse(raw);
const frameworks = ['react', 'angular', 'vue', 'svelte'];
const cases = ['render100', 'render500', 'render1000', 'update50', 'delete50'];
const sources = ['src/react/main.jsx', 'src/angular/main.ts', 'src/vue/App.vue', 'src/svelte/App.svelte'];
await Promise.all(sources.map(path => access(path)));
assert.equal(results.samples, 10);
assert.equal(results.warmups, 3);
assert.ok(Number.isFinite(Date.parse(results.timestamp)));
assert.ok(results.browser && results.environment.cpu);
assert.deepEqual([...results.order].sort(), [...frameworks].sort());
const table = await read('results/RESULTS.md');
for (const framework of frameworks) {
  const dependency = framework === 'angular' ? '@angular/core' : framework;
  assert.equal(results.versions[framework], pkg.dependencies[dependency]);
  const line = table.split('\n').find(row => row.startsWith(`| ${framework} |`));
  assert.ok(line, `Missing results table row: ${framework}`);
  for (const key of cases) {
    const metric = results.frameworks[framework][key];
    assert.equal(metric.samples.length, 10);
    assert.ok(metric.samples.every(value => Number.isFinite(value) && value >= 0));
    const sorted = [...metric.samples].sort((a,b) => a - b);
    assert.equal(metric.median, (sorted[4] + sorted[5]) / 2);
    assert.equal(metric.min, sorted[0]);
    assert.equal(metric.max, sorted[9]);
    assert.ok(line.includes(`${metric.median.toFixed(2)} ms`));
  }
  const memory = results.memory[framework];
  assert.ok(Number.isFinite(memory.before) && Number.isFinite(memory.after));
  assert.equal(memory.delta, memory.after - memory.before);
  assert.ok(line.includes(`${(memory.delta / 1048576).toFixed(2)} MiB`));
  await access(`dist/${framework}.html`);
  await access(`dist/${framework}.js`);
}
assert.equal(await read('public/results.json'), raw);
assert.equal(await read('dist/results.json'), raw);
const reflection = (await read('REFLECTION.md')).replace(/^# Reflection report\s*/, '').trim();
const words = reflection.split(/\s+/).length;
assert.ok(words >= 200 && words <= 300, `Reflection has ${words} words; expected 200–300`);
assert.equal((await read('public/reflection.txt')).trim(), reflection);
assert.equal((await read('dist/reflection.txt')).trim(), reflection);
console.log(`PASS deliverables: four app sources/bundles, 20 timing cases and 200 raw samples, statistics, versions, memory, dashboard data, ${words}-word reflection`);
