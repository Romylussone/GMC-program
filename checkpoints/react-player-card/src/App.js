import PlayersList from "./PlayersList";
import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <section className="app-header">
        <p className="app-kicker">Ultimate XI Showcase</p>
        <h1>FIFA Player Cards</h1>
      </section>
      <PlayersList />
    </main>
  );
}

export default App;
