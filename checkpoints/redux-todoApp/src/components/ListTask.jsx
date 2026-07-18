import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../features/todos/todosSlice';
import Task from './Task';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'done', label: 'Done' },
  { value: 'notDone', label: 'Not done' },
];

export default function ListTask() {
  const { tasks, filter } = useSelector((state) => state.todos);
  const dispatch = useDispatch();
  const visibleTasks = tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.isDone : !task.isDone));

  return (
    <section className="list-section" aria-labelledby="tasks-heading">
      <div className="list-header">
        <h2 id="tasks-heading">Your tasks</h2>
        <div className="filters" aria-label="Filter tasks">
          {filters.map(({ value, label }) => (
            <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => dispatch(setFilter(value))}>{label}</button>
          ))}
        </div>
      </div>
      {visibleTasks.length ? (
        <ul className="task-list">{visibleTasks.map((task) => <Task key={task.id} task={task} />)}</ul>
      ) : (
        <p className="empty-state">No tasks match this filter.</p>
      )}
    </section>
  );
}
