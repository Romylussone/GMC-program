const VALID_PRIORITIES = new Set(["High", "Medium", "Low"]);

function parseTimeToMinutes(time) {
  if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Invalid time "${time}". Use HH:MM format.`);
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time "${time}". Time must be within 00:00 and 23:59.`);
  }

  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function createTask(name, startTime, endTime, priority) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Task name must be a non-empty string.");
  }

  if (!VALID_PRIORITIES.has(priority)) {
    throw new Error(`Priority must be one of: ${Array.from(VALID_PRIORITIES).join(", ")}.`);
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    throw new Error("Task end time must be after start time.");
  }

  return {
    name,
    startTime,
    endTime,
    priority,
    startMinutes,
    endMinutes,
  };
}

function getStartMinutes(task) {
  return Number.isFinite(task.startMinutes) ? task.startMinutes : parseTimeToMinutes(task.startTime);
}

function getEndMinutes(task) {
  return Number.isFinite(task.endMinutes) ? task.endMinutes : parseTimeToMinutes(task.endTime);
}

function sortTasksByStartTime(tasks) {
  return [...tasks].sort((taskA, taskB) => {
    return (
      getStartMinutes(taskA) - getStartMinutes(taskB) ||
      getEndMinutes(taskA) - getEndMinutes(taskB) ||
      taskA.name.localeCompare(taskB.name)
    );
  });
}

function groupTasksByPriority(tasks) {
  const groups = new Map();

  for (const task of tasks) {
    if (!groups.has(task.priority)) {
      groups.set(task.priority, []);
    }

    groups.get(task.priority).push(task);
  }

  return groups;
}

function detectOverlappingTasks(tasks) {
  const events = [];

  for (const task of tasks) {
    events.push({ type: "start", time: getStartMinutes(task), task });
    events.push({ type: "end", time: getEndMinutes(task), task });
  }

  events.sort((eventA, eventB) => {
    if (eventA.time !== eventB.time) {
      return eventA.time - eventB.time;
    }

    if (eventA.type === eventB.type) {
      return eventA.task.name.localeCompare(eventB.task.name);
    }

    return eventA.type === "end" ? -1 : 1;
  });

  const activeTasks = new Set();
  const overlaps = [];

  for (const event of events) {
    if (event.type === "end") {
      activeTasks.delete(event.task);
      continue;
    }

    for (const activeTask of activeTasks) {
      const overlapStart = Math.max(getStartMinutes(activeTask), getStartMinutes(event.task));
      const overlapEnd = Math.min(getEndMinutes(activeTask), getEndMinutes(event.task));

      if (overlapStart < overlapEnd) {
        overlaps.push({
          taskA: activeTask.name,
          taskB: event.task.name,
          overlapStart: formatMinutes(overlapStart),
          overlapEnd: formatMinutes(overlapEnd),
        });
      }
    }

    activeTasks.add(event.task);
  }

  return overlaps;
}

function estimateMemoryUsage(tasks) {
  const objectOverheadBytes = 48;
  const arrayReferenceBytes = 8;
  const numberBytes = 8;
  const stringCharacterBytes = 2;

  let estimatedBytes = 0;

  for (const task of tasks) {
    estimatedBytes += objectOverheadBytes;
    estimatedBytes += arrayReferenceBytes;
    estimatedBytes += numberBytes * 2;
    estimatedBytes += String(task.name).length * stringCharacterBytes;
    estimatedBytes += String(task.startTime).length * stringCharacterBytes;
    estimatedBytes += String(task.endTime).length * stringCharacterBytes;
    estimatedBytes += String(task.priority).length * stringCharacterBytes;
  }

  return {
    taskCount: tasks.length,
    estimatedBytes,
    estimatedKilobytes: Number((estimatedBytes / 1024).toFixed(2)),
  };
}

function toDisplayTask(task) {
  return {
    name: task.name,
    startTime: task.startTime,
    endTime: task.endTime,
    priority: task.priority,
  };
}

module.exports = {
  createTask,
  detectOverlappingTasks,
  estimateMemoryUsage,
  formatMinutes,
  groupTasksByPriority,
  parseTimeToMinutes,
  sortTasksByStartTime,
  toDisplayTask,
};
