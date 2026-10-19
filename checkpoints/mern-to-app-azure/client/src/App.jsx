import { useEffect, useRef, useState } from 'react';
import { request } from './api.js';

function Icon({ name, ...props }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path d="m16 3 5 5-12 12H4v-5L16 3Z" />
        <path d="m13 6 5 5" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </>
    ),
    list: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11M3 6h1M3 12h1M3 18h1" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2m-3-9-1.5 1.5M5.5 18.5 4 20M4 4l1.5 1.5m13 13L20 20" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

function TodoItem({ todo, busy, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const input = useRef(null);

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  async function save(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    if (await onUpdate(todo._id, { title: draft.trim() })) setEditing(false);
  }

  function cancel() {
    setDraft(todo.title);
    setEditing(false);
  }

  return (
    <li className={`task ${todo.completed ? 'is-complete' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={todo.completed}
        disabled={busy || editing}
        onChange={() => onUpdate(todo._id, { completed: !todo.completed })}
        aria-label={`Mark ${todo.title} ${todo.completed ? 'active' : 'complete'}`}
      />
      {editing ? (
        <form
          className="edit-form"
          onSubmit={save}
          onKeyDown={(event) => {
            if (event.key === 'Escape') cancel();
          }}
        >
          <input
            ref={input}
            aria-label="Edit task title"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={200}
            required
            disabled={busy}
          />
          <button className="small-button" disabled={busy || !draft.trim()}>
            Save
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={cancel}
            disabled={busy}
            aria-label="Cancel editing"
          >
            <Icon name="close" />
          </button>
        </form>
      ) : (
        <>
          <span className="task-title">{todo.title}</span>
          <div className="task-actions">
            <button
              className="icon-button"
              onClick={() => {
                setDraft(todo.title);
                setEditing(true);
              }}
              disabled={busy}
              aria-label={`Edit ${todo.title}`}
            >
              <Icon name="edit" />
            </button>
            <button
              className="icon-button delete-button"
              onClick={() => onDelete(todo._id)}
              disabled={busy}
              aria-label={`Delete ${todo.title}`}
            >
              <Icon name="trash" />
            </button>
          </div>
        </>
      )}
    </li>
  );
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const newTaskInput = useRef(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setTodos(await request());
      setLoadFailed(false);
    } catch (err) {
      setError(err.message);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function mutate(action, success) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(success);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addTodo(event) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    const added = await mutate(async () => {
      const todo = await request('', { method: 'POST', body: { title: title.trim() } });
      setTodos((current) => [todo, ...current]);
      setTitle('');
      setFilter('All');
    }, 'Task added.');
    if (added) newTaskInput.current?.focus();
  }

  function updateTodo(id, body) {
    return mutate(async () => {
      const updated = await request(`/${id}`, { method: 'PATCH', body });
      setTodos((current) => current.map((todo) => (todo._id === id ? updated : todo)));
    }, 'Task updated.');
  }

  function deleteTodo(id) {
    return mutate(async () => {
      await request(`/${id}`, { method: 'DELETE' });
      setTodos((current) => current.filter((todo) => todo._id !== id));
    }, 'Task deleted.');
  }

  function clearCompleted() {
    return mutate(async () => {
      await request('/completed', { method: 'DELETE' });
      setTodos((current) => current.filter((todo) => !todo.completed));
    }, 'Completed tasks cleared.');
  }

  const completed = todos.filter((todo) => todo.completed).length;
  const remaining = todos.length - completed;
  const visible = todos.filter(
    (todo) => filter === 'All' || (filter === 'Completed' ? todo.completed : !todo.completed),
  );
  const progress = todos.length ? Math.round((completed / todos.length) * 100) : 0;
  const disabled = loading || loadFailed || busy;
  const date = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Daylist home">
          <span className="brand-icon">
            <Icon name="check" />
          </span>
          daylist<span className="brand-dot">.</span>
        </a>
        <span className="header-note">A little less on your mind.</span>
      </header>

      <main>
        <section className="intro">
          <p className="eyebrow">
            <Icon name="sun" /> YOUR EVERYDAY, ORGANIZED
          </p>
          <h1>
            Small steps.
            <br />
            <span>Clearer days.</span>
          </h1>
          <p className="intro-copy">
            A place for everything you want to get done.
            <br className="desktop-break" /> Take it one task at a time.
          </p>
          <div className="date-label">{date}</div>
        </section>

        <div className="workspace">
          <section className="task-board" aria-label="Your tasks">
            <form className="add-form" onSubmit={addTodo}>
              <label className="sr-only" htmlFor="new-task">
                New task
              </label>
              <Icon name="plus" />
              <input
                id="new-task"
                ref={newTaskInput}
                placeholder="What would you like to get done?"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                required
                disabled={disabled}
                autoComplete="off"
              />
              <button className="primary-button" disabled={disabled || !title.trim()}>
                {busy ? 'Saving…' : 'Add task'}
                <Icon name="arrow" />
              </button>
            </form>

            {error && (
              <div className="error-banner" role="alert">
                <span>{error}</span>
                {loadFailed && (
                  <button onClick={load} disabled={loading}>
                    Try again
                  </button>
                )}
              </div>
            )}
            <div className="sr-only" role="status">
              {notice}
            </div>

            <div className="board-toolbar">
              <div className="filters" role="group" aria-label="Filter tasks">
                {['All', 'Active', 'Completed'].map((option) => (
                  <button
                    key={option}
                    aria-pressed={filter === option}
                    className={filter === option ? 'selected' : ''}
                    onClick={() => setFilter(option)}
                  >
                    {option}
                    {option === 'All' && <span>{todos.length}</span>}
                  </button>
                ))}
              </div>
              <span className="task-count">{remaining} left to do</span>
            </div>

            {loading ? (
              <div className="empty-state" role="status">
                <span className="loading-dot" />
                Getting your tasks…
              </div>
            ) : loadFailed ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name="list" />
                </span>
                <h2>Let’s get connected</h2>
                <p>Your tasks will appear when the server is available.</p>
              </div>
            ) : visible.length ? (
              <ul className="task-list">
                {visible.map((todo) => (
                  <TodoItem
                    key={todo._id}
                    todo={todo}
                    busy={busy}
                    onUpdate={updateTodo}
                    onDelete={deleteTodo}
                  />
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name={filter === 'Active' ? 'check' : 'list'} />
                </span>
                <h2>
                  {filter === 'Completed'
                    ? 'Good things take a first step'
                    : filter === 'Active' && todos.length
                      ? 'All caught up. Nicely done!'
                      : 'A fresh start awaits'}
                </h2>
                <p>
                  {filter === 'Completed'
                    ? 'Completed tasks will find a home here.'
                    : filter === 'Active' && todos.length
                      ? 'Take a breath. You’ve earned it.'
                      : 'Add your first task and make a little progress.'}
                </p>
              </div>
            )}

            <footer className="board-footer">
              <span>
                <Icon name="check" />
                One task at a time.
              </span>
              <button onClick={clearCompleted} disabled={disabled || !completed}>
                Clear completed{completed > 0 ? ` (${completed})` : ''}
              </button>
            </footer>
          </section>

          <aside className="sidebar" aria-label="Your progress">
            <div className="progress-card">
              <div className="card-heading">
                <span className="mini-icon">
                  <Icon name="sun" />
                </span>
                <h2>The big picture</h2>
              </div>
              <p>A little progress goes a long way.</p>
              <div className="progress-number">
                {progress}
                <span>%</span>
              </div>
              <progress max="100" value={progress} aria-label="Tasks completed" />
              <div className="progress-caption">of your tasks completed</div>
              <dl className="stats">
                <div>
                  <dt>Total tasks</dt>
                  <dd>{todos.length}</dd>
                </div>
                <div>
                  <dt>
                    <span className="status-dot active-dot" />
                    In progress
                  </dt>
                  <dd>{remaining}</dd>
                </div>
                <div>
                  <dt>
                    <span className="status-dot complete-dot" />
                    Completed
                  </dt>
                  <dd>{completed}</dd>
                </div>
              </dl>
            </div>
            <div className="quote-card">
              <span className="quote-mark">“</span>
              <p>
                You don’t have to do it all.
                <br />
                Just the next small thing.
              </p>
              <span>A FRIENDLY REMINDER</span>
            </div>
          </aside>
        </div>
      </main>
      <footer className="site-footer">
        <span>Less clutter. More headspace.</span>
        <span>
          Made for your everyday <span className="footer-spark">✳</span>
        </span>
      </footer>
    </div>
  );
}
