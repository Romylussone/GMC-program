import { useState } from 'react'
import './App.css'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'

const FILTERS = {
  all: () => true,
  pending: (todo) => !todo.completed,
  done: (todo) => todo.completed,
}

const initialTodos = [
  { id: crypto.randomUUID(), text: 'Sketch the component responsibilities', completed: true },
  { id: crypto.randomUUID(), text: 'Build the controlled input flow', completed: false },
  { id: crypto.randomUUID(), text: 'Wire filtering and remaining count', completed: false },
]

function App() {
  const [todos, setTodos] = useState(initialTodos)
  const [filter, setFilter] = useState('all')

  const addTodo = (text) => {
    const trimmedText = text.trim()

    if (!trimmedText) {
      return false
    }

    setTodos((currentTodos) => [
      {
        id: crypto.randomUUID(),
        text: trimmedText,
        completed: false,
      },
      ...currentTodos,
    ])

    return true
  }

  const deleteTodo = (id) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id))
  }

  const toggleTodo = (id) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }

  const filteredTodos = todos.filter(FILTERS[filter])
  const remainingCount = todos.filter((todo) => !todo.completed).length

  return (
    <main className="app-shell">
      <section className="todo-panel">
        <div className="panel-copy">
          <p className="eyebrow">Todo App Lab</p>
          <h1>Plan the work. Finish the work.</h1>
          <p className="lede">
            A focused React todo app built with lifted state, controlled input,
            and prop-driven components.
          </p>
        </div>

        <TodoForm onAdd={addTodo} />

        <section className="toolbar" aria-label="Todo controls">
          <div className="filter-group" role="tablist" aria-label="Filter todos">
            {Object.keys(FILTERS).map((filterName) => (
              <button
                key={filterName}
                type="button"
                className={filter === filterName ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setFilter(filterName)}
                aria-pressed={filter === filterName}
              >
                {filterName}
              </button>
            ))}
          </div>

          <p className="remaining-count">
            {remainingCount} {remainingCount === 1 ? 'task' : 'tasks'} left
          </p>
        </section>

        <TodoList
          todos={filteredTodos}
          onDelete={deleteTodo}
          onToggle={toggleTodo}
        />
      </section>
    </main>
  )
}

export default App
