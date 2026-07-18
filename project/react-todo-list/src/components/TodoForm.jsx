import { useState } from 'react'

function TodoForm({ onAdd }) {
  const [value, setValue] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    const didAddTodo = onAdd(value)

    if (didAddTodo) {
      setValue('')
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="todo-input"
        placeholder="Add a task that moves the day forward"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="New todo"
      />
      <button type="submit" className="todo-button">
        Add todo
      </button>
    </form>
  )
}

export default TodoForm