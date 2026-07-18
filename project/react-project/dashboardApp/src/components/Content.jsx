import Card from './Card'
import './Content.css'

function Content() {
  return (
    <main className="dashboard-content">
      <section className="dashboard-content__intro">
        <h2>Overview</h2>
        <p>Your dashboard cards are organized below with a simple flexbox layout.</p>
      </section>
      <Card />
    </main>
  )
}

export default Content
