export const frameworks = ['react', 'angular', 'vue', 'svelte'];
export const labels = { react: 'React', angular: 'Angular', vue: 'Vue', svelte: 'Svelte' };
export const cases = [
  { key: 'render100', label: 'Render 100', count: 100, operation: 'render' },
  { key: 'render500', label: 'Render 500', count: 500, operation: 'render' },
  { key: 'render1000', label: 'Render 1,000', count: 1000, operation: 'render' },
  { key: 'update50', label: 'Update 50', count: 1000, operation: 'update' },
  { key: 'delete50', label: 'Delete 50', count: 1000, operation: 'delete' }
];
const names = ['Review project proposal', 'Update design system', 'Write component tests', 'Plan the next sprint', 'Polish dashboard layout', 'Document API endpoints', 'Fix navigation on mobile', 'Prepare release notes'];
const priorities = ['High', 'Medium', 'Low'];
export function makeTasks(count) { return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `${names[i % 8]}${i >= 8 ? ` · ${i + 1}` : ''}`, priority: priorities[i % 3] })); }
export function median(values) { const sorted = [...values].sort((a,b) => a-b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; }
export async function waitForApp(frame) {
  const deadline = performance.now() + 20000;
  while (!frame.contentWindow?.bench) {
    if (performance.now() > deadline) throw new Error('Framework did not become ready. Check the browser console.');
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}
export async function runFramework(target, { samples = 10, warmups = 3, progress = () => {} } = {}) {
  const results = {};
  for (const test of cases) {
    const times = [];
    for (let i = 0; i < warmups + samples; i++) {
      // Build fixtures before starting the clock; each repetition gets fresh objects.
      const baseline = makeTasks(test.count);
      const next = test.operation === 'render' ? baseline : test.operation === 'delete' ? baseline.slice(50) : baseline.map((t, index) => index < 50 ? { ...t, name: `${t.name} (updated)`, priority: priorities[(priorities.indexOf(t.priority) + 1) % 3] } : t);
      await target.bench.replace(test.operation === 'render' ? [] : baseline);
      target.bench.layout();
      await new Promise(resolve => setTimeout(resolve, 16));
      const start = target.performance.now();
      await target.bench.replace(next);
      target.bench.layout();
      const elapsed = target.performance.now() - start;
      // Verification is intentionally outside the timed region.
      const rows = [...target.document.querySelectorAll('.task-row')];
      if (rows.length !== next.length || rows.some((row, index) => row.dataset.id !== String(next[index].id) || row.querySelector('input').value !== next[index].name || row.querySelector('select').value !== next[index].priority)) throw new Error(`DOM verification failed for ${test.key}`);
      if (i >= warmups) times.push(elapsed);
    }
    results[test.key] = { median: median(times), min: Math.min(...times), max: Math.max(...times), samples: times };
    progress(test.key);
  }
  return results;
}
