import UserList from './UserList';
import './App.css';

function App() {
  return (
    <main className="app-shell">
      <section className="directory" aria-labelledby="page-title">
        <p className="eyebrow">JSONPlaceholder API</p>
        <h1 id="page-title">User directory</h1>
        <p className="intro">Meet the people in our sample community.</p>
        <UserList />
      </section>
    </main>
  );
}

export default App;
