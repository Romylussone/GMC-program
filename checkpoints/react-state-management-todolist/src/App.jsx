import { useEffect, useMemo, useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

const STORAGE_KEY = 'taskflow-tasks';

/** Loads saved tasks safely so a malformed localStorage value cannot break the app. */
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch {
    return [];
  }
}

/** Coordinates task state, browser storage, filtering, and the edit form. */
export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');

  // Keep localStorage synchronized whenever the user changes the task list.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => filter === 'all' || (filter === 'completed' ? task.completed : !task.completed)),
    [tasks, filter],
  );

  const completedCount = tasks.filter((task) => task.completed).length;

  /** Adds a new task or saves the task currently being edited. */
  function handleSaveTask({ title, description }) {
    if (editingTask) {
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === editingTask.id ? { ...task, title, description } : task
      )));
      setEditingTask(null);
      return;
    }

    setTasks((currentTasks) => [
      { id: crypto.randomUUID(), title, description, completed: false, createdAt: Date.now() },
      ...currentTasks,
    ]);
  }

  /** Changes a task's completion state without mutating the existing array. */
  function handleToggleTask(id) {
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === id ? { ...task, completed: !task.completed } : task
    )));
  }

  /** Confirms and then permanently removes an individual task. */
  function handleDeleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (task && window.confirm(`Delete “${task.title}”? This cannot be undone.`)) {
      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== id));
      if (editingTask?.id === id) setEditingTask(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">PERSONAL PLANNER</p>
        <h1 id="page-title">Make space for what matters.</h1>
        <p className="hero-copy">Capture your next move, then make it happen.</p>
        <div className="progress-card" aria-label={`${completedCount} of ${tasks.length} tasks completed`}>
          <div className="progress-heading"><span>Today’s progress</span><strong>{completedCount} / {tasks.length}</strong></div>
          <div className="progress-track"><span style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%' }} /></div>
        </div>
      </section>

      <section className="workspace" aria-label="Task manager">
        <TaskForm editingTask={editingTask} onSave={handleSaveTask} onCancel={() => setEditingTask(null)} />
        <div className="task-panel">
          <div className="task-panel-header">
            <div><p className="eyebrow">YOUR LIST</p><h2>Tasks</h2></div>
            <div className="filters" aria-label="Filter tasks">
              {['all', 'active', 'completed'].map((option) => <button key={option} className={filter === option ? 'active' : ''} onClick={() => setFilter(option)}>{option}</button>)}
            </div>
          </div>
          <TaskList tasks={visibleTasks} onToggle={handleToggleTask} onEdit={setEditingTask} onDelete={handleDeleteTask} />
        </div>
      </section>
    </main>
  );
}
