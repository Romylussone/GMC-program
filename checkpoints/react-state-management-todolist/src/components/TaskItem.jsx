/** Displays one task and exposes controls for completion, editing, and deletion. */
export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      <button className="check-button" onClick={() => onToggle(task.id)} aria-label={`Mark ${task.title} as ${task.completed ? 'active' : 'completed'}`}>{task.completed && '✓'}</button>
      <button className="task-content" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>
        <strong>{task.title}</strong><span>{task.description}</span>
      </button>
      <div className="item-actions">
        <button onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task">✎</button>
        <button className="delete" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`} title="Delete task">×</button>
      </div>
    </li>
  );
}
