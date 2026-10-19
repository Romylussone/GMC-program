import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, seedUsers } from '../server.js';
import { DistributedStore } from '../src/store.js';

test('HTTP API covers seeded data, CRUD, membership, failures, and validation', async (t) => {
  const store = new DistributedStore();
  await seedUsers(store);
  const server = createApi(store);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, method = 'GET', body) {
    const response = await fetch(`${base}${path}`, {
      method, headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }
  assert.equal((await request('/health')).status, 200);
  assert.equal((await request('/v1/kv/user%3A101')).body.value.name, 'Alice');
  assert.equal((await request('/v1/kv/a%2Fb', 'PUT', null)).status, 200);
  assert.equal((await request('/v1/kv/a%2Fb')).body.value, null);
  assert.equal((await request('/v1/kv/a%2Fb', 'DELETE')).status, 200);
  assert.equal((await request('/v1/kv/a%2Fb')).status, 404);
  assert.equal((await request('/admin/nodes', 'POST', { id: 'node-d' })).status, 201);
  assert.equal((await request('/admin/nodes', 'POST', { id: 'node-d' })).status, 409);
  assert.equal((await request('/admin/nodes/node-d', 'DELETE')).status, 200);
  const placement = (await request('/admin/keys/user:101')).body;
  assert.equal((await request(`/admin/nodes/${placement.primary}/fail`, 'POST')).status, 200);
  await request('/admin/cache', 'DELETE');
  assert.equal((await request('/v1/kv/user:101')).body.source, 'replica');
  assert.equal((await request('/v1/kv/user:101', 'PUT', { name: 'Bob' })).status, 503);
  for (const id of placement.replicas) await request(`/admin/nodes/${id}/fail`, 'POST');
  await request('/admin/cache', 'DELETE');
  assert.equal((await request('/v1/kv/user:101')).status, 503);
  for (const id of [placement.primary, ...placement.replicas]) {
    assert.equal((await request(`/admin/nodes/${id}/recover`, 'POST')).status, 200);
  }
  assert.equal((await request('/v1/kv/user:101')).body.value.name, 'Alice');
  assert.equal((await request('/admin/stats')).body.totalKeys, 6);
  assert.equal((await request('/admin/nodes', 'POST', null)).status, 400);
  assert.equal((await request('/v1/kv/%ZZ')).status, 400);
  assert.equal((await request('/v1/kv/x', 'POST')).status, 405);
  assert.equal((await request('/missing')).status, 404);
  const malformed = await fetch(`${base}/v1/kv/x`, { method: 'PUT', body: '{' });
  assert.equal(malformed.status, 400);
  await malformed.json();
  const oversized = await fetch(`${base}/v1/kv/x`, { method: 'PUT', body: 'x'.repeat(1024 * 1024 + 1) });
  assert.equal(oversized.status, 413);
  await oversized.json();
});
