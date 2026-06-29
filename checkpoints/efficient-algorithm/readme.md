# Lightweight Task Scheduler

This checkpoint implements a small task scheduler for a to-do application. Each task has a name, start time, end time, and priority.

## Run

```bash
npm start
```

Run the dependency-free tests:

```bash
npm test
```

## Features

- Create tasks with validated `HH:MM` start and end times.
- Sort tasks by start time with `Array.prototype.sort()`.
- Group tasks by priority with a `Map`.
- Detect overlapping tasks with a sweep-line interval algorithm.
- Estimate approximate memory usage for a task list.

## Data Model

```js
{
  name: "Write project brief",
  startTime: "09:00",
  endTime: "10:30",
  priority: "High",
  startMinutes: 540,
  endMinutes: 630
}
```

The numeric minute values are stored once when the task is created. This avoids repeatedly parsing time strings during sorting and overlap detection.

## Complexity Analysis

| Function | Time Complexity | Space Complexity | Notes |
| --- | --- | --- | --- |
| `createTask` | `O(1)` | `O(1)` | Validates one task and stores precomputed start/end minutes. |
| `sortTasksByStartTime` | `O(n log n)` | `O(n)` | Copies the array before sorting so the original task list is not mutated. |
| `groupTasksByPriority` | `O(n)` | `O(n)` | Uses a hash map-like `Map` for fast priority lookups. |
| `detectOverlappingTasks` | `O(n log n + k)` | `O(n + k)` | Sorts start/end events, then reports each overlap. `k` is the number of overlaps found. |
| `estimateMemoryUsage` | `O(n)` | `O(1)` | Produces a rough estimate. Actual JavaScript memory usage depends on the runtime engine. |

## Optimization Notes

- Sorting is the best general-purpose option for unordered task lists because comparison sorting is `O(n log n)`.
- Priority grouping uses `Map` so insertions and lookups are average-case `O(1)`.
- Overlap detection uses a sweep line instead of checking every pair up front. It only emits actual overlaps, so its cost scales with the output size.
- The scheduler treats intervals as half-open: a task ending at `10:00` does not overlap with a task starting at `10:00`.
