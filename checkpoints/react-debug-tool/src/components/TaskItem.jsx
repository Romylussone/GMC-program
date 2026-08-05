export default function TaskItem({ task, onToggle, onRemove }) {
  return (
    <li className="task-item">
      <label>
        <input type="checkbox" checked={task.completed} onChange={onToggle} />
        <span className={task.completed ? 'completed' : ''}>{task.title}</span>
      </label>
      <button type="button" onClick={onRemove} aria-label={`Remove ${task.title}`}>
        Remove
      </button>
    </li>
  );
}
