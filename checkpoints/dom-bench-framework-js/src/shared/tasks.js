export const priorities = ['High', 'Medium', 'Low'];
const names = ['Review project proposal', 'Update design system', 'Write component tests', 'Plan the next sprint', 'Polish dashboard layout', 'Document API endpoints', 'Fix navigation on mobile', 'Prepare release notes'];
export function makeTasks(count) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `${names[i % names.length]}${i >= names.length ? ` · ${i + 1}` : ''}`, priority: priorities[i % 3] }));
}
export function updateTasks(tasks) {
  return tasks.map((task, index) => index < 50 ? { ...task, name: `${task.name} (updated)`, priority: priorities[(priorities.indexOf(task.priority) + 1) % 3] } : task);
}
export function expose(setTasks, getTasks) {
  window.bench = {
    async replace(tasks) { await setTasks(tasks); },
    snapshot: () => getTasks().map(task => ({ ...task })),
    layout() { return document.querySelector('.task-list').offsetHeight; }
  };
}
