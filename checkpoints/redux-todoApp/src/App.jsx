import Addtask from './components/Addtask';
import ListTask from './components/ListTask';

export default function App() {
  return (
    <main className="app-shell">
      <section className="todo-card">
        <p className="eyebrow">REDUX TOOLKIT</p>
        <h1>Todo list</h1>
        <p className="intro">Keep your tasks in one predictable global state.</p>
        <Addtask />
        <ListTask />
      </section>
    </main>
  );
}
