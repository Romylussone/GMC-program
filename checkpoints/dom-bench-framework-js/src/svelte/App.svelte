<script>
  import { tick } from 'svelte';
  import { expose, makeTasks } from '../shared/tasks.js';
  let tasks = $state(makeTasks(8));
  let name = $state('');
  let priority = $state('Medium');
  expose(async next => { tasks = next; await tick(); }, () => tasks);
  function add(event) {
    event.preventDefault();
    if (!name.trim()) return;
    tasks.push({ id: Math.max(0, ...tasks.map(t => t.id)) + 1, name: name.trim(), priority });
    name = '';
  }
</script>
<main class="workspace">
  <form class="add-task" onsubmit={add}>
    <input aria-label="Task name" placeholder="What needs to get done?" bind:value={name} maxlength="160" required />
    <select aria-label="Task priority" bind:value={priority}><option>High</option><option>Medium</option><option>Low</option></select>
    <button type="submit">+ Add task</button>
  </form>
  <div class="list-heading"><span>TASK NAME</span><span>PRIORITY</span><span>ACTION</span></div>
  <div class="task-list">{#each tasks as task (task.id)}<div class="task-row" data-id={task.id}>
    <input aria-label="Edit task name" bind:value={task.name} maxlength="160" />
    <select aria-label="Edit priority" bind:value={task.priority} class={task.priority.toLowerCase()}><option>High</option><option>Medium</option><option>Low</option></select>
    <button aria-label={`Delete ${task.name}`} class="delete" onclick={() => tasks = tasks.filter(t => t.id !== task.id)}>×</button>
  </div>{/each}</div>
  {#if !tasks.length}<p class="empty">All clear. Add a task to get started.</p>{/if}
  <footer><span>{tasks.length} tasks</span><span>Changes save in this session · Edit any field directly</span></footer>
</main>
