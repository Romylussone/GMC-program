import { createSlice, nanoid } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    tasks: [
      { id: 'welcome-task', description: 'Add your first task', isDone: false },
    ],
    filter: 'all',
  },
  reducers: {
    addTask: {
      reducer: (state, action) => {
        state.tasks.unshift(action.payload);
      },
      prepare: (description) => ({
        payload: { id: nanoid(), description, isDone: false },
      }),
    },
    toggleTask: (state, action) => {
      const task = state.tasks.find((item) => item.id === action.payload);
      if (task) task.isDone = !task.isDone;
    },
    editTask: (state, action) => {
      const { id, description } = action.payload;
      const task = state.tasks.find((item) => item.id === id);
      if (task) task.description = description;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
});

export const { addTask, toggleTask, editTask, setFilter } = todosSlice.actions;
export default todosSlice.reducer;
