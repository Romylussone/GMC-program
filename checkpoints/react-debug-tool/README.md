# React Debug Tool

A compact Vite + React application for practising React Developer Tools. It has a clear component tree, props passed through multiple levels, and local state in `App` and `AddTaskForm`.

## Run it

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Install React Developer Tools from the browser's extension store (or use the standalone app), then open browser developer tools and choose **Components**.

## Component tree to inspect

```
App (tasks state)
|- TaskSummary (total, completed)
|- AddTaskForm (draft state, onAddTask)
`- TaskList (tasks, onToggleTask, onRemoveTask)
   `- TaskItem (task, onToggle, onRemove) x N
```

## Debugging record

The exercise began with three expected failure modes identified during a Components-panel inspection:

| Area | Fault observed | Fix implemented |
| --- | --- | --- |
| Task completion | A stale state update can lose changes during rapid interaction. | `toggleTask` uses the functional `setTasks(currentTasks => ...)` form. |
| Summary props | The summary can display an incorrect count if `completed` is passed as a fixed value. | `completedCount` is derived from `tasks` with `useMemo` and passed as `completed`. |
| Item callbacks | Passing an item callback without its task id causes the wrong task (or none) to change. | `TaskList` closes over `task.id` for both callback props. |

### React Developer Tools workflow

1. Select `App` in **Components** and confirm the `tasks` hook has three items, one completed.
2. Select `TaskSummary` and confirm `total: 3` and `completed: 1` props.
3. Select a `TaskItem`; verify its `task` prop and callback props. Toggle its checkbox and watch `App` state plus `TaskSummary` props update.
4. Add a task; inspect `AddTaskForm` to confirm `draft` resets to an empty string and `App` receives a new task with `completed: false`.
5. Remove a task; confirm the item leaves both `App.tasks` and the component tree.

## Verification checklist

- Initial summary reads **1 complete**, **2 remaining**, **3 total**.
- Toggling any checkbox changes only that task and immediately updates the summary.
- Adding a non-empty task adds it as incomplete and clears the input.
- Submitting whitespace does not add a task.
- Removing a task removes the matching row and updates totals.
