import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { activeServices, seconds, clock, loadGtfs } from '../src/gtfs.js';
import { generate } from '../src/generate.js';
import { Planner } from '../src/planner.js';
import { createApi } from '../src/server.js';

const metadata = { timezone: 'Etc/UTC', calendar: [{ service_id: 'WK', monday: '1',
  start_date: '20260101', end_date: '20261231' }], exceptions: [
  { service_id: 'WK', date: '20260105', exception_type: '2' },
  { service_id: 'SPECIAL', date: '20260105', exception_type: '1' },
] };

test('service dates apply additions/removals after weekday and date-range checks', () => {
  assert.deepEqual(activeServices(metadata, '20261019'), ['WK']);
  assert.deepEqual(activeServices(metadata, '20261024'), []);
  assert.deepEqual(activeServices(metadata, '20260105'), ['SPECIAL']);
  assert.deepEqual(activeServices(metadata, '20270101'), []);
  assert.throws(() => activeServices(metadata, '20260230'), /Invalid service date/);
});

test('GTFS times preserve hours after midnight and reject invalid times', () => {
  assert.equal(seconds('25:10:00'), 90600);
  assert.equal(clock(90600), '25:10:00');
  for (const time of ['12:60:00', '12:00:60', '-1:00:00', '08:00', 'garbage']) assert.throws(() => seconds(time));
});

function memoryStore(feed) {
  return {
    metadata: async () => feed.metadata,
    departures: async (stop, services, start, end) => feed.departures.filter(d => d.stopId === stop
      && services.includes(d.serviceId) && d.departure >= start && d.departure <= end),
    trips: async ids => feed.trips.filter(t => ids.includes(t.id)),
  };
}

test('direct journeys respect stop order, repeated stops, pickup/drop-off and earliest arrival', async () => {
  const call = (stopId, seq, time, pickup = '0', dropOff = '0') => ({ stopId, seq,
    arrival: seconds(time), departure: seconds(time), pickup, dropOff });
  const trips = [
    { id: 'slow', routeId: 'R', serviceId: 'WK', calls: [call('A', 0, '24:10:00'), call('B', 1, '25:00:00')] },
    { id: 'fast', routeId: 'R', serviceId: 'WK', calls: [call('B', 0, '24:00:00'), call('A', 1, '24:15:00'), call('B', 2, '24:30:00')] },
    { id: 'no-pickup', routeId: 'R', serviceId: 'WK', calls: [call('A', 0, '24:01:00', '1'), call('B', 1, '24:02:00')] },
    { id: 'no-dropoff', routeId: 'R', serviceId: 'WK', calls: [call('A', 0, '24:01:00'), call('B', 1, '24:02:00', '0', '1')] },
  ];
  const feed = { trips, metadata, departures: trips.flatMap(t => t.calls.map(c => ({ ...c,
    tripId: t.id, routeId: t.routeId, serviceId: t.serviceId }))) };
  const planner = new Planner(memoryStore(feed));
  const result = await planner.plan({ from: 'A', to: 'B', date: '20261019', time: '24:00:00' });
  assert.deepEqual(result.map(r => r.tripId), ['fast', 'slow']);
  assert.equal(result[0].toSeq, 2);
  assert.equal(result[0].arrival, '24:30:00');
  assert.equal(result[0].serviceDate, '20261019');
  assert.deepEqual(await planner.plan({ from: 'A', to: 'B', date: '20261024', time: '24:00:00' }), []);
});

test('CSV import validates references and stop sequence, supports quoted names and exception-only calendars', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gtfs-checkpoint-'));
  try {
    await generate(dir, 1, 2);
    const path = join(dir, 'stops.txt');
    const stops = await readFile(path, 'utf8');
    await writeFile(path, stops.replace('Route 0 Stop 0', '"Central, Station"'));
    const feed = await loadGtfs(dir);
    assert.equal(feed.stops[0].name, 'Central, Station');
    assert.equal(feed.departures.length, 24);
    await rm(join(dir, 'calendar.txt'));
    await writeFile(join(dir, 'calendar_dates.txt'), 'service_id,date,exception_type\nWK,20261019,1\nWE,20261024,1\n');
    assert.equal((await loadGtfs(dir)).metadata.calendar.length, 0);
    const timesPath = join(dir, 'stop_times.txt'), times = await readFile(timesPath, 'utf8');
    await writeFile(timesPath, times.replace(',S0_1,1,', ',UNKNOWN,1,'));
    await assert.rejects(loadGtfs(dir), /Unknown trip\/stop/);
    await writeFile(timesPath, times.replace(',S0_1,1,', ',S0_1,0,'));
    await assert.rejects(loadGtfs(dir), /Non-monotonic trip/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('HTTP API serves journeys and reports invalid input, unknown paths and methods', async () => {
  const planner = new Planner(memoryStore({ metadata, departures: [], trips: [] }));
  const server = createApi(planner, 'test');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const root = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${root}/health`)).status, 200);
    const empty = await fetch(`${root}/plan?from=A&to=B&date=20261019&time=08:00:00`);
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), []);
    for (const path of ['/plan?from=A&to=A', '/departures?stop=A&date=20260230&time=08:00:00',
      '/stops/nearby?lon=&lat=5', '/plan?from=A&to=B&limit=NaN']) {
      assert.equal((await fetch(`${root}${path}`)).status, 400);
    }
    assert.equal((await fetch(`${root}/unknown`)).status, 404);
    assert.equal((await fetch(`${root}/plan`, { method: 'POST' })).status, 405);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
