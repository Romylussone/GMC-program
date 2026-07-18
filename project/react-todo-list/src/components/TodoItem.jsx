function TodoItem({ todo, onDelete, onToggle }) {
  return (
    <li className="todo-card">
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark ${todo.text} as ${todo.completed ? 'pending' : 'done'}`}
      />

      <span className={todo.completed ? 'todo-text completed' : 'todo-text'}>
        {todo.text}
      </span>

      <button
        type="button"
        className="todo-action"
        onClick={() => onDelete(todo.id)}
      >
        Delete
      </button>
    </li>
  )
}

export default TodoItem