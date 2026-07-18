import { useEffect, useState } from 'react';

/** Validated form used both to add a task and update an existing task. */
export default function TaskForm({ editingTask, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  // Populate the fields whenever the user selects a task for editing.
  useEffect(() => {
    setTitle(editingTask?.title ?? '');
    setDescription(editingTask?.description ?? '');
    setErrors({});
  }, [editingTask]);

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Please give your task a name.';
    if (!description.trim()) nextErrors.description = 'Add a short description for this task.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({ title: title.trim(), description: description.trim() });
    if (!editingTask) {
      setTitle('');
      setDescription('');
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <div className="form-title-row">
        <div><p className="eyebrow">{editingTask ? 'UPDATE TASK' : 'NEW TASK'}</p><h2>{editingTask ? 'Edit your task' : 'What’s next?'}</h2></div>
        <span className="form-icon" aria-hidden="true">✦</span>
      </div>
      <label htmlFor="task-title">Task name</label>
      <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={Boolean(errors.title)} placeholder="e.g. Plan the project kickoff" />
      {errors.title && <p className="error">{errors.title}</p>}
      <label htmlFor="task-description">Description</label>
      <textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={Boolean(errors.description)} placeholder="Add a little context..." rows="4" />
      {errors.description && <p className="error">{errors.description}</p>}
      <div className="form-actions">
        {editingTask && <button className="button secondary" type="button" onClick={onCancel}>Cancel</button>}
        <button className="button primary" type="submit">{editingTask ? 'Save changes' : 'Add task'} <span aria-hidden="true">→</span></button>
      </div>
    </form>
  );
}
