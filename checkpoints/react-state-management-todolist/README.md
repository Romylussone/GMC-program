# TaskFlow — React State Management To-Do List

A small React to-do list application that demonstrates component state, controlled form inputs, validation, list updates, and browser persistence.

## Run locally

1. Open a terminal in this project folder.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open the local URL shown by Vite in your browser.

Use `npm run build` to create a production build.

## Features

- Add tasks with required name and description validation.
- Click a task or its edit icon to update its details.
- Mark tasks complete, delete them with confirmation, and filter by status.
- Persist tasks in `localStorage` under the `taskflow-tasks` key, so they remain after refreshes and future sessions.
