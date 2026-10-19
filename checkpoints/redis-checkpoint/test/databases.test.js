import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generate } from '../src/generate.js';
import { loadGtfs } from '../src/gtfs.js';
import { openStore } from '../src/stores.js';
import { Planner } from '../src/planner.js';
import { createApi } from '../src/server.js';

test('real Redis and MongoDB return expected journeys, calendars and nearby stops', {
  skip: process.env.TEST_DATABASES !== '1',
}, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gtfs-checkpoint-db-'));
  try {
    await generate(dir, 1, 12);
    const feed = await loadGtfs(dir);
    for (const kind of ['redis', 'mongo']) {
      const store = await openStore(kind, 'integration');
      try {
        await store.import(feed);
        const planner = new Planner(store);
        const query = { from: 'S0_0', to: 'S0_11', date: '20261019', time: '08:00:00' };
        const result = await planner.plan(query);
        assert.equal(result[0].departure, '10:00:00', kind);
        assert.equal(result[0].arrival, '10:22:00', kind);
        assert.equal((await planner.plan({ ...query, date: '20261024' }))[0].departure, '08:00:00');
        assert.equal((await planner.plan({ ...query, date: '20260105' }))[0].departure, '08:00:00');
        assert.equal((await planner.plan({ ...query, time: '25:00:00' }))[0].arrival, '26:22:00');
        assert.deepEqual(await planner.plan({ ...query, date: '20270101' }), []);
        assert.deepEqual(await planner.plan({ ...query, from: 'S0_11', to: 'S0_0' }), []);
        assert.equal((await planner.nearby({ lon: -4.03, lat: 5.32, radius: 100 }))[0].id, 'S0_0');
        // Reloading replaces indexes/data rather than duplicating departure rows.
        await store.import(feed);
        assert.deepEqual(await planner.plan(query), result);
        assert(!('_id' in feed.departures[0]), 'Driver must not mutate the shared feed');
        const server = createApi(planner, kind);
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
          const response = await fetch(`http://127.0.0.1:${server.address().port}/plan?from=S0_0&to=S0_11&date=20261019&time=08:00:00`);
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), result);
        } finally {
          server.closeAllConnections();
          await new Promise(resolve => server.close(resolve));
        }
      } finally { await store.close(); }
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
