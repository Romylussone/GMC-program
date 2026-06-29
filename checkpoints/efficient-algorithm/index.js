const {
  createTask,
  detectOverlappingTasks,
  estimateMemoryUsage,
  groupTasksByPriority,
  sortTasksByStartTime,
  toDisplayTask,
} = require("./taskScheduler");

const tasks = [
  createTask("Write project brief", "09:00", "10:30", "High"),
  createTask("Team standup", "09:30", "10:00", "Medium"),
  createTask("Code review", "10:15", "11:15", "High"),
  createTask("Email follow-up", "11:30", "12:00", "Low"),
  createTask("Design planning", "10:45", "12:15", "Medium"),
  createTask("Deploy checklist", "13:00", "13:45", "High"),
];

function printPriorityGroups(groups) {
  const printableGroups = {};

  for (const [priority, priorityTasks] of groups) {
    printableGroups[priority] = priorityTasks.map((task) => task.name);
  }

  console.log(printableGroups);
}

console.log("Tasks sorted by start time");
console.table(sortTasksByStartTime(tasks).map(toDisplayTask));

console.log("Tasks grouped by priority");
printPriorityGroups(groupTasksByPriority(tasks));

console.log("Overlapping tasks");
console.table(detectOverlappingTasks(tasks));

console.log("Estimated memory usage");
console.log(estimateMemoryUsage(tasks));
