const assert = require("node:assert/strict");

const {
  createTask,
  detectOverlappingTasks,
  estimateMemoryUsage,
  groupTasksByPriority,
  sortTasksByStartTime,
} = require("./taskScheduler");

const tasks = [
  createTask("Task A", "10:00", "11:00", "High"),
  createTask("Task B", "09:00", "09:30", "Low"),
  createTask("Task C", "10:30", "11:30", "Medium"),
  createTask("Task D", "11:30", "12:00", "Low"),
];

const sortedTasks = sortTasksByStartTime(tasks);
assert.deepEqual(
  sortedTasks.map((task) => task.name),
  ["Task B", "Task A", "Task C", "Task D"]
);

const groupedTasks = groupTasksByPriority(tasks);
assert.equal(groupedTasks.get("High").length, 1);
assert.equal(groupedTasks.get("Medium").length, 1);
assert.equal(groupedTasks.get("Low").length, 2);

const overlaps = detectOverlappingTasks(tasks);
assert.deepEqual(overlaps, [
  {
    taskA: "Task A",
    taskB: "Task C",
    overlapStart: "10:30",
    overlapEnd: "11:00",
  },
]);

const memoryEstimate = estimateMemoryUsage(tasks);
assert.equal(memoryEstimate.taskCount, 4);
assert.equal(memoryEstimate.estimatedBytes > 0, true);

console.log("All tests passed.");
