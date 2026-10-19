import test from 'node:test';
import assert from 'node:assert/strict';
import { HashRing, hash } from '../src/hash-ring.js';
import { LruCache } from '../src/cache.js';
import { DistributedStore } from '../src/store.js';

test('ring wraps around, selects distinct replicas, and is independent of input order', () => {
  const ring = new HashRing(['a', 'b', 'c'], 16);
  const reversed = new HashRing(['c', 'b', 'a'], 16);
  for (let index = 0; index < 1000; index++) {
    const key = `key:${index}`;
    const expected = ring.tokens.find((token) => token.position >= hash(key)) ?? ring.tokens[0];
    assert.equal(ring.owners(key)[0], expected.nodeId);
    assert.deepEqual(ring.owners(key, 10), reversed.owners(key, 10));
    assert.equal(new Set(ring.owners(key, 10)).size, 3);
  }
  assert.deepEqual(new HashRing().owners('key'), []);
});

test('LRU promotes reads, evicts least-recent entry, and expires at TTL boundary', () => {
  let now = 100;
  const cache = new LruCache({ capacity: 2, ttlMs: 10, now: () => now });
  cache.set('a', null);
  cache.set('b', 2);
  assert.deepEqual(cache.get('a'), { hit: true, value: null });
  cache.set('c', 3);
  assert.equal(cache.get('b').hit, false);
  now = 110;
  assert.equal(cache.get('a').hit, false);
  assert.deepEqual(cache.stats(), {
    hits: 1, misses: 2, evictions: 1, expirations: 2, size: 0, capacity: 2, ttlMs: 10,
  });
  const disabled = new LruCache({ capacity: 0 });
  disabled.set('a', 1);
  assert.equal(disabled.get('a').hit, false);
});

test('join/leave preserve values and change only required key placements', () => {
  const store = new DistributedStore({ cache: { capacity: 0 } });
  const keys = Array.from({ length: 1000 }, (_, index) => `key:${index}`);
  keys.forEach((key, index) => store.set(key, { index }));
  const snapshot = () => new Map(keys.map((key) => [key, store.inspectKey(key)]));
  const before = snapshot();
  const joined = store.joinNode('node-d');
  let changed = 0;
  let added = 0;
  let removed = 0;
  for (const [index, key] of keys.entries()) {
    const current = store.inspectKey(key);
    const previous = before.get(key);
    if (previous.primary !== current.primary) {
      changed++;
      assert.equal(current.primary, 'node-d');
    }
    added += current.copies.filter((id) => !previous.copies.includes(id)).length;
    removed += previous.copies.filter((id) => !current.copies.includes(id)).length;
    assert.deepEqual(new Set(current.copies), new Set([current.primary, ...current.replicas]));
    assert.deepEqual(store.get(key).value, { index });
  }
  assert.equal(joined.primaryKeysMoved, changed);
  assert.equal(joined.copiesAdded, added);
  assert.equal(joined.copiesRemoved, removed);
  assert.ok(changed > 0 && changed < keys.length);
  const afterJoin = snapshot();
  const left = store.leaveNode('node-d');
  assert.equal(left.primaryKeysMoved, changed);
  for (const [index, key] of keys.entries()) {
    const current = store.inspectKey(key);
    if (current.primary !== afterJoin.get(key).primary) assert.equal(afterJoin.get(key).primary, 'node-d');
    assert.deepEqual(current, before.get(key));
    assert.deepEqual(store.get(key).value, { index });
  }
});

test('single-node expansion and contraction adjust the effective replica count', () => {
  const store = new DistributedStore({ nodes: ['a'] });
  store.set('key', false);
  assert.equal(store.stats().effectiveReplicationFactor, 1);
  assert.equal(store.joinNode('b').copiesAdded, 1);
  assert.equal(store.inspectKey('key').copies.length, 2);
  store.leaveNode('a');
  assert.equal(store.get('key').value, false);
  assert.deepEqual(store.inspectKey('key').copies, ['b']);
  assert.throws(() => store.leaveNode('b'), { status: 409 });
});

test('cache avoids storage reads and writes/deletes invalidate cached values', () => {
  const store = new DistributedStore();
  store.set('key', { count: 1 });
  assert.equal(store.get('key').source, 'primary');
  const reads = store.stats().operations.storageReads;
  assert.equal(store.get('key').source, 'cache');
  assert.equal(store.stats().operations.storageReads, reads);
  store.set('key', { count: 2 });
  assert.deepEqual(store.get('key').value, { count: 2 });
  store.delete('key');
  assert.throws(() => store.get('key'), { status: 404 });
});

test('replica failover, bounded cache availability, rejected writes, and recovery', () => {
  let now = 0;
  const store = new DistributedStore({ cache: { ttlMs: 10, now: () => now } });
  store.set('key', { name: 'Alice' });
  const { primary, replicas: [replica] } = store.inspectKey('key');
  store.failNode(primary);
  assert.equal(store.get('key').source, 'replica');
  assert.throws(() => store.set('key', { name: 'Wrong' }), { status: 503 });
  assert.throws(() => store.delete('key'), { status: 503 });
  assert.throws(() => store.joinNode('new'), { status: 503 });
  assert.throws(() => store.leaveNode(primary), { status: 503 });
  store.failNode(replica);
  assert.equal(store.get('key').source, 'cache');
  now = 10;
  assert.throws(() => store.get('key'), { status: 503 });
  store.recoverNode(primary);
  assert.deepEqual(store.get('key').value, { name: 'Alice' });
  store.recoverNode(replica);
  store.set('key', { name: 'Updated' });
  store.failNode(primary);
  assert.deepEqual(store.get('key').value, { name: 'Updated' });
});

test('an unrelated failed node does not prevent writes to healthy owners', () => {
  const store = new DistributedStore();
  const owners = store.inspectKey('key').copies;
  assert.equal(owners.length, 0);
  const placement = store.inspectKey('key');
  const unrelated = store.stats().nodes.find((node) => ![placement.primary, ...placement.replicas].includes(node.id));
  store.failNode(unrelated.id);
  store.set('key', null);
  assert.equal(store.get('key').value, null);
});

test('values are isolated from mutations and invalid operations have clear errors', () => {
  const store = new DistributedStore();
  const original = { names: ['Alice'] };
  store.set('key', original);
  original.names.push('Bob');
  store.get('key').value.names.push('Charlie');
  assert.deepEqual(store.get('key').value, { names: ['Alice'] });
  assert.throws(() => store.set('', {}), { status: 400 });
  assert.throws(() => store.set('bad', undefined), { status: 400 });
  const cycle = {}; cycle.self = cycle;
  assert.throws(() => store.set('bad', cycle), { status: 400 });
  assert.throws(() => store.joinNode('node-a'), { status: 409 });
  assert.throws(() => store.failNode('missing'), { status: 404 });
  assert.throws(() => store.get('missing'), { status: 404 });
});
