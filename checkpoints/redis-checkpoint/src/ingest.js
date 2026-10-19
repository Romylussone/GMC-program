import { loadGtfs } from './gtfs.js';
import { openStore } from './stores.js';

const dir = process.argv[2] || 'data/sample';
const selected = process.argv[3] || 'both';
if (!['both', 'redis', 'mongo'].includes(selected)) throw new Error('Choose both, redis or mongo');
const start = performance.now();
const feed = await loadGtfs(dir);
console.log(`Parsed ${feed.stops.length} stops, ${feed.trips.length} trips, ${feed.departures.length} stop times in ${(performance.now() - start).toFixed(1)} ms`);
for (const kind of selected === 'both' ? ['redis', 'mongo'] : [selected]) {
  const store = await openStore(kind);
  try {
    const begin = performance.now();
    await store.import(feed);
    console.log(`${kind}: import and indexes ${(performance.now() - begin).toFixed(1)} ms`);
  } finally { await store.close(); }
}
