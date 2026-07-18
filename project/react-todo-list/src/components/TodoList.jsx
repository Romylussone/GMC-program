import TodoItem from './TodoItem'

function TodoList({ todos, onDelete, onToggle }) {
  if (todos.length === 0) {
    return <p className="empty-state">No todos match this filter yet.</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </ul>
  )
}

export default TodoList