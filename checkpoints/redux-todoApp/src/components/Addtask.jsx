import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTask } from '../features/todos/todosSlice';

export default function Addtask() {
  const [description, setDescription] = useState('');
  const dispatch = useDispatch();

  function handleSubmit(event) {
    event.preventDefault();
    const cleanDescription = description.trim();
    if (!cleanDescription) return;

    dispatch(addTask(cleanDescription));
    setDescription('');
  }

  return (
    <form className="add-task" onSubmit={handleSubmit}>
      <label htmlFor="new-task">What needs to be done?</label>
      <div className="add-task-row">
        <input
          id="new-task"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Review Redux concepts"
        />
        <button type="submit">Add task</button>
      </div>
    </form>
  );
}
