import TaskItem from './TaskItem';

/** Renders the filtered list, including the helpful empty state. */
export default function TaskList({ tasks, onToggle, onEdit, onDelete }) {
  if (!tasks.length) return <div className="empty-state"><span>✓</span><h3>Nothing here yet</h3><p>Add a task above, or choose another filter to see your list.</p></div>;
  return <ul className="task-list">{tasks.map((task) => <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</ul>;
}
