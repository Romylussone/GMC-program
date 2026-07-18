import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { editTask, toggleTask } from '../features/todos/todosSlice';

export default function Task({ task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description);
  const dispatch = useDispatch();

  function saveEdit(event) {
    event.preventDefault();
    const cleanDescription = description.trim();
    if (!cleanDescription) return;
    dispatch(editTask({ id: task.id, description: cleanDescription }));
    setIsEditing(false);
  }

  function cancelEdit() {
    setDescription(task.description);
    setIsEditing(false);
  }

  return (
    <li className={`task ${task.isDone ? 'done' : ''}`}>
      <button
        className="check-button"
        type="button"
        onClick={() => dispatch(toggleTask(task.id))}
        aria-label={`Mark ${task.description} as ${task.isDone ? 'not done' : 'done'}`}
      >
        {task.isDone ? '✓' : ''}
      </button>

      {isEditing ? (
        <form className="edit-form" onSubmit={saveEdit}>
          <input aria-label="Task description" value={description} onChange={(event) => setDescription(event.target.value)} autoFocus />
          <button type="submit">Save</button>
          <button type="button" className="text-button" onClick={cancelEdit}>Cancel</button>
        </form>
      ) : (
        <>
          <span>{task.description}</span>
          <button className="text-button edit-button" type="button" onClick={() => setIsEditing(true)}>Edit</button>
        </>
      )}
    </li>
  );
}
