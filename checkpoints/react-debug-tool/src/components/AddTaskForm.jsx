import { useState } from 'react';

export default function AddTaskForm({ onAddTask }) {
  const [draft, setDraft] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onAddTask(draft);
    setDraft('');
  }

  return (
    <form className="add-task" onSubmit={handleSubmit}>
      <label htmlFor="new-task">New task</label>
      <div>
        <input
          id="new-task"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="e.g. Check selected component props"
        />
        <button type="submit">Add</button>
      </div>
    </form>
  );
}
