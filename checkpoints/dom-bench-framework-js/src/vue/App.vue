<script setup>
import { ref, nextTick } from 'vue';
import { expose, makeTasks } from '../shared/tasks.js';
const tasks = ref(makeTasks(8));
const name = ref('');
const priority = ref('Medium');
expose(async next => { tasks.value = next; await nextTick(); }, () => tasks.value);
function add() {
  if (!name.value.trim()) return;
  tasks.value.push({ id: Math.max(0, ...tasks.value.map(t => t.id)) + 1, name: name.value.trim(), priority: priority.value });
  name.value = '';
}
</script>
<template>
  <main class="workspace">
    <form class="add-task" @submit.prevent="add">
      <input aria-label="Task name" placeholder="What needs to get done?" v-model="name" maxlength="160" required>
      <select aria-label="Task priority" v-model="priority"><option>High</option><option>Medium</option><option>Low</option></select>
      <button type="submit">+ Add task</button>
    </form>
    <div class="list-heading"><span>TASK NAME</span><span>PRIORITY</span><span>ACTION</span></div>
    <div class="task-list"><div class="task-row" v-for="task in tasks" :key="task.id" :data-id="task.id">
      <input aria-label="Edit task name" v-model="task.name" maxlength="160">
      <select aria-label="Edit priority" v-model="task.priority" :class="task.priority.toLowerCase()"><option>High</option><option>Medium</option><option>Low</option></select>
      <button :aria-label="`Delete ${task.name}`" class="delete" @click="tasks = tasks.filter(t => t.id !== task.id)">×</button>
    </div></div>
    <p v-if="!tasks.length" class="empty">All clear. Add a task to get started.</p>
    <footer><span>{{ tasks.length }} tasks</span><span>Changes save in this session · Edit any field directly</span></footer>
  </main>
</template>
