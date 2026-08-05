import { useMemo, useState } from 'react';
import AddTaskForm from './components/AddTaskForm.jsx';
import TaskList from './components/TaskList.jsx';
import TaskSummary from './components/TaskSummary.jsx';

const initialTasks = [
  { id: 1, title: 'Inspect component tree', completed: true },
  { id: 2, title: 'Verify props in DevTools', completed: false },
  { id: 3, title: 'Confirm state updates', completed: false },
];

export default function App() {
  const [tasks, setTasks] = useState(initialTasks);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );

  function addTask(title) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setTasks((currentTasks) => [
      ...currentTasks,
      { id: crypto.randomUUID(), title: trimmedTitle, completed: false },
    ]);
  }

  function toggleTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function removeTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">React Developer Tools sample</p>
        <h1>Task Debugger</h1>
        <p>Use this small component tree to inspect props and state updates.</p>
      </header>

      <TaskSummary total={tasks.length} completed={completedCount} />
      <AddTaskForm onAddTask={addTask} />
      <TaskList tasks={tasks} onToggleTask={toggleTask} onRemoveTask={removeTask} />
    </main>
  );
}
