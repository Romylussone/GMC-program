export default function TaskSummary({ total, completed }) {
  return (
    <section className="summary" aria-label="Task summary">
      <strong>{completed} complete</strong>
      <span>{total - completed} remaining</span>
      <span>{total} total</span>
    </section>
  );
}
