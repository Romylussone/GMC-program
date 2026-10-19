import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { cpus, platform, release, totalmem } from 'node:os';
import assert from 'node:assert/strict';
import { loadGtfs, clock } from './gtfs.js';
import { openStore } from './stores.js';
import { Planner } from './planner.js';

const dir = resolve(process.argv[2] || 'data/benchmark');
const output = resolve(process.argv[3] || 'results/local.json');
const requests = Number(process.env.REQUESTS || 240);
const repeats = Number(process.env.REPEATS || 3);
if (![requests, repeats].every(n => Number.isInteger(n) && n > 0)) throw new Error('Invalid REQUESTS/REPEATS');
const start = performance.now();
const feed = await loadGtfs(dir);
const parseMs = performance.now() - start;
const checksum = createHash('sha256');
for (const name of (await readdir(dir)).filter(n => n.endsWith('.txt')).sort()) {
  checksum.update(name).update(await readFile(join(dir, name)));
}
const uniqueOriginStops = [...new Set(feed.trips.map(t => t.calls[0].stopId))];
const tripAtStop = new Map(feed.trips.map(t => [t.calls[0].stopId, t]));
const stopMap = new Map(feed.stops.map(s => [s.id, s]));
const workloads = { departures: [], plan: [], nearby: [] };
for (let i = 0; i < 48; i++) {
  const from = uniqueOriginStops[i % uniqueOriginStops.length];
  const trip = tripAtStop.get(from), stop = stopMap.get(from);
  const last = trip.calls.at(-1).stopId;
  const date = ['20261019', '20261024', '20260105', '20270101'][i % 4];
  const time = clock(21600 + (i % 48) * 1800);
  workloads.departures.push({ stop: from, date, time, window: 10800 });
  workloads.plan.push({ from: i % 10 ? from : last, to: i % 10 ? last : from,
    date, time, window: 10800, limit: 5 });
  workloads.nearby.push({ lon: stop.lon + 0.0003, lat: stop.lat + 0.0013, radius: 650 });
}

const percentile = (sorted, p) => sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
async function measure(planner, name, specs, concurrency) {
  const durations = [];
  let next = 0, emptyResults = 0, returnedItems = 0;
  const begin = performance.now();
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < requests) {
      const index = next++;
      const t = performance.now();
      const result = await planner[name](specs[index % specs.length]);
      durations.push(performance.now() - t);
      if (!result.length) emptyResults++;
      returnedItems += result.length;
    }
  }));
  const elapsedMs = performance.now() - begin;
  durations.sort((a, b) => a - b);
  return { requests, elapsedMs, throughputPerSecond: requests * 1000 / elapsedMs, emptyResults, returnedItems,
    p50Ms: percentile(durations, 0.5), p95Ms: percentile(durations, 0.95),
    p99Ms: percentile(durations, 0.99), samplesMs: durations };
}

const stores = {};
const report = {
  measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: platform(), osRelease: release(),
    cpu: cpus()[0]?.model, logicalCpus: cpus().length, hostMemoryBytes: totalmem() },
  dataset: { source: dir, sha256: checksum.digest('hex'), stops: feed.stops.length,
    trips: feed.trips.length, stopTimes: feed.departures.length, parseMs },
  methodology: { requestsPerTrial: requests, repeats, concurrency: [1, 8], warmupPerWorkload: 30,
    workloadSpecsPerType: 48, dates: 'weekday, weekend, exception, out-of-range',
    scope: 'Client-side planner calls including DB I/O and deserialization; excludes HTTP and connection setup.',
    load: 'Closed loop: each worker sends its next request after the previous one completes.',
    persistence: 'Redis AOF everysec; MongoDB standalone w:1,j:true. Durability is not equivalent.',
    failures: 'Any query error or parity mismatch aborts the run; no success report is written.' },
  databases: {}, correctness: {}, trials: [], summary: [],
};
try {
  for (const kind of ['redis', 'mongo']) {
    stores[kind] = await openStore(kind, 'benchmark');
    const begin = performance.now();
    await stores[kind].import(feed);
    report.databases[kind] = { importAndIndexMs: performance.now() - begin };
    console.log(`${kind}: imported ${feed.departures.length} stop times`);
  }
  const planners = Object.fromEntries(Object.entries(stores).map(([k, s]) => [k, new Planner(s)]));
  for (const [name, specs] of Object.entries(workloads)) {
    const hash = createHash('sha256');
    let nonempty = 0;
    for (const spec of specs) {
      const a = await planners.redis[name](spec), b = await planners.mongo[name](spec);
      assert.deepEqual(a, b, `${name} parity failure: ${JSON.stringify(spec)}`);
      hash.update(JSON.stringify(a));
      if (a.length) nonempty++;
    }
    assert(nonempty > 0, `All ${name} results are empty; unsuitable workload`);
    report.correctness[name] = { compared: specs.length, nonempty, resultSha256: hash.digest('hex') };
  }
  console.log('Correctness: all 144 Redis/MongoDB result comparisons passed');
  for (let repeat = 0; repeat < repeats; repeat++) {
    for (const concurrency of [1, 8]) {
      for (const [name, specs] of Object.entries(workloads)) {
        // Alternate order between trials to reduce systematic order bias.
        for (const kind of repeat % 2 ? ['mongo', 'redis'] : ['redis', 'mongo']) {
          for (let i = 0; i < 30; i++) await planners[kind][name](specs[i % specs.length]);
          const result = await measure(planners[kind], name, specs, concurrency);
          report.trials.push({ database: kind, workload: name, concurrency, repeat: repeat + 1, ...result });
          console.log(`${kind} ${name} c=${concurrency} trial=${repeat + 1}: p95=${result.p95Ms.toFixed(2)} ms, ${result.throughputPerSecond.toFixed(0)} req/s`);
        }
      }
    }
  }
  for (const kind of Object.keys(stores)) {
    report.databases[kind].afterQueries = await stores[kind].stats();
    for (const workload of Object.keys(workloads)) {
      for (const concurrency of [1, 8]) {
        const trials = report.trials.filter(t => t.database === kind && t.workload === workload && t.concurrency === concurrency);
        const median = key => percentile(trials.map(t => t[key]).sort((a, b) => a - b), 0.5);
        report.summary.push({ database: kind, workload, concurrency,
          medianP50Ms: median('p50Ms'), medianP95Ms: median('p95Ms'),
          medianP99Ms: median('p99Ms'), medianThroughputPerSecond: median('throughputPerSecond') });
      }
    }
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Results: ${output}`);
} finally { await Promise.all(Object.values(stores).map(s => s.close())); }
