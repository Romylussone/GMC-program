import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { expose, makeTasks } from '../shared/tasks.js';

function App() {
  const [tasks, setTasks] = useState(makeTasks(8));
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('Medium');
  expose(next => flushSync(() => setTasks(next)), () => tasks);
  function add(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setTasks([...tasks, { id: Math.max(0, ...tasks.map(t => t.id)) + 1, name: name.trim(), priority }]);
    setName('');
  }
  function edit(id, key, value) { setTasks(tasks.map(t => t.id === id ? { ...t, [key]: value } : t)); }
  return <main className="workspace">
    <form className="add-task" onSubmit={add}>
      <input aria-label="Task name" placeholder="What needs to get done?" value={name} onChange={e => setName(e.target.value)} maxLength={160} required />
      <select aria-label="Task priority" value={priority} onChange={e => setPriority(e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select>
      <button type="submit">+ Add task</button>
    </form>
    <div className="list-heading"><span>TASK NAME</span><span>PRIORITY</span><span>ACTION</span></div>
    <div className="task-list">{tasks.map(task => <div className="task-row" data-id={task.id} key={task.id}>
      <input aria-label="Edit task name" value={task.name} maxLength={160} onChange={e => edit(task.id, 'name', e.target.value)} />
      <select aria-label="Edit priority" className={task.priority.toLowerCase()} value={task.priority} onChange={e => edit(task.id, 'priority', e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select>
      <button aria-label={`Delete ${task.name}`} className="delete" onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}>×</button>
    </div>)}</div>
    {!tasks.length && <p className="empty">All clear. Add a task to get started.</p>}
    <footer><span>{tasks.length} tasks</span><span>Changes save in this session · Edit any field directly</span></footer>
  </main>;
}
createRoot(document.getElementById('app')).render(<App />);
