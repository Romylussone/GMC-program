const { performance } = require("node:perf_hooks");

const BRUTE_FORCE_LIMIT = 24;

const sampleTasks = [
  { start: 1, end: 3 },
  { start: 2, end: 5 },
  { start: 4, end: 6 },
  { start: 6, end: 7 },
  { start: 5, end: 9 },
  { start: 8, end: 10 },
];

function isCompatible(task, selectedTasks) {
  return selectedTasks.every(
    (selected) => task.start >= selected.end || task.end <= selected.start
  );
}

function bruteForceSchedule(tasks, options = {}) {
  const limit = options.limit ?? BRUTE_FORCE_LIMIT;

  if (tasks.length > limit) {
    throw new Error(
      `Brute force is limited to ${limit} tasks here; ${tasks.length} tasks would require up to 2^${tasks.length} subsets.`
    );
  }

  const sortedTasks = [...tasks].sort(
    (a, b) => a.start - b.start || a.end - b.end
  );
  let best = [];

  function search(index, selected) {
    if (index === sortedTasks.length) {
      if (selected.length > best.length) {
        best = [...selected];
      }
      return;
    }

    search(index + 1, selected);

    const task = sortedTasks[index];
    if (isCompatible(task, selected)) {
      selected.push(task);
      search(index + 1, selected);
      selected.pop();
    }
  }

  search(0, []);
  return best.sort((a, b) => a.start - b.start || a.end - b.end);
}

function greedySchedule(tasks) {
  const sortedTasks = [...tasks].sort(
    (a, b) => a.end - b.end || a.start - b.start
  );
  const selected = [];
  let lastEnd = -Infinity;

  for (const task of sortedTasks) {
    if (task.start >= lastEnd) {
      selected.push(task);
      lastEnd = task.end;
    }
  }

  return selected;
}

function makeRandom(seed) {
  let state = seed;

  return function random() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateRandomTasks(count, seed = 42) {
  const random = makeRandom(seed);
  const tasks = [];

  for (let i = 0; i < count; i += 1) {
    const start = Math.floor(random() * count * 2);
    const duration = 1 + Math.floor(random() * 50);
    tasks.push({ start, end: start + duration });
  }

  return tasks;
}

function generateOverlappingTasks(count) {
  return Array.from({ length: count }, (_, index) => ({
    start: index,
    end: count + 10,
  }));
}

function generateNonOverlappingTasks(count) {
  return Array.from({ length: count }, (_, index) => ({
    start: index * 2,
    end: index * 2 + 1,
  }));
}

function generateSameBoundaryTasks() {
  return [
    { start: 1, end: 4 },
    { start: 1, end: 3 },
    { start: 1, end: 2 },
    { start: 2, end: 5 },
    { start: 3, end: 5 },
    { start: 5, end: 7 },
    { start: 6, end: 7 },
  ];
}

function time(label, callback) {
  const startedAt = performance.now();
  const result = callback();
  const elapsedMs = performance.now() - startedAt;
  console.log(`${label}: ${elapsedMs.toFixed(3)} ms`);
  return result;
}

function printSchedule(label, schedule) {
  console.log(`${label} count: ${schedule.length}`);
  console.log(`${label} tasks: ${JSON.stringify(schedule)}`);
}

function compareSmallCase(name, tasks) {
  console.log(`\n${name}`);
  const bruteForceResult = time("Brute force", () => bruteForceSchedule(tasks));
  const greedyResult = time("Greedy", () => greedySchedule(tasks));
  const countsMatch = bruteForceResult.length === greedyResult.length;

  console.log(`Counts match: ${countsMatch}`);
  console.log(`Selected count: ${greedyResult.length}`);
}

function run() {
  console.log("Sample validation");
  const bruteForceSample = time("Brute force sample", () =>
    bruteForceSchedule(sampleTasks)
  );
  const greedySample = time("Greedy sample", () => greedySchedule(sampleTasks));

  printSchedule("Brute force sample", bruteForceSample);
  printSchedule("Greedy sample", greedySample);
  console.log(
    `Sample counts match: ${bruteForceSample.length === greedySample.length}`
  );

  console.log("\nLarge input benchmark");
  const largeTasks = generateRandomTasks(10_000);
  const greedyLarge = time("Greedy 10,000 random tasks", () =>
    greedySchedule(largeTasks)
  );
  console.log(`Greedy selected count: ${greedyLarge.length}`);

  try {
    time("Brute force 10,000 random tasks", () => bruteForceSchedule(largeTasks));
  } catch (error) {
    console.log(`Brute force 10,000 random tasks: skipped - ${error.message}`);
  }

  const bruteForceBenchmarkTasks = largeTasks.slice(0, BRUTE_FORCE_LIMIT);
  const bruteForceLargeSubset = time(
    `Brute force first ${BRUTE_FORCE_LIMIT} random tasks`,
    () => bruteForceSchedule(bruteForceBenchmarkTasks)
  );
  const greedyLargeSubset = time(
    `Greedy first ${BRUTE_FORCE_LIMIT} random tasks`,
    () => greedySchedule(bruteForceBenchmarkTasks)
  );
  console.log(
    `Subset counts match: ${
      bruteForceLargeSubset.length === greedyLargeSubset.length
    }`
  );

  console.log("\nStress tests");
  compareSmallCase("All tasks overlapping", generateOverlappingTasks(20));
  compareSmallCase("All tasks non-overlapping", generateNonOverlappingTasks(20));
  compareSmallCase("Same start or end time", generateSameBoundaryTasks());
}

run();

module.exports = {
  bruteForceSchedule,
  greedySchedule,
  generateRandomTasks,
  generateOverlappingTasks,
  generateNonOverlappingTasks,
  generateSameBoundaryTasks,
};
