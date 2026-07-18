import './Card.css'

const cards = [
  {
    title: 'Card 1',
    description: 'Track today’s tasks, priorities, and recent activity at a glance.',
  },
  {
    title: 'Card 2',
    description: 'Review profile progress and keep your personal information updated.',
  },
  {
    title: 'Card 3',
    description: 'Manage settings, preferences, and dashboard customization options.',
  },
]

function Card() {
  return (
    <section className="card-grid" aria-label="Dashboard cards">
      {cards.map((card) => (
        <article className="dashboard-card" key={card.title}>
          <h3>{card.title}</h3>
          <p>{card.description}</p>
        </article>
      ))}
    </section>
  )
}

export default Card
