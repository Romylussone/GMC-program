import assert from 'node:assert/strict';
import { DistributedStore } from './src/store.js';
import { seedUsers } from './server.js';

const store = new DistributedStore();
await seedUsers(store);

console.log('\n1. Six sample users distributed across three nodes (two copies each).');
console.table(Array.from({ length: 6 }, (_, index) => {
  const key = `user:${101 + index}`;
  const { primary, replicas } = store.inspectKey(key);
  return { key, name: store.get(key).value.name, primary, replica: replicas.join(', ') };
}));

console.log('\n2. Transparent reads: clients use the same key regardless of its owner.');
store.clearCache();
const readsBefore = store.stats().operations.storageReads;
console.log('First read:', store.get('user:101'));
console.log('Second read:', store.get('user:101'));
console.log(`Storage reads for two requests: ${store.stats().operations.storageReads - readsBefore} (cache avoided one).`);

console.log('LRU and TTL example (capacity 2, TTL 10 ms, controlled clock):');
let now = 0;
const cachedStore = new DistributedStore({ cache: { capacity: 2, ttlMs: 10, now: () => now } });
for (const key of ['a', 'b', 'c']) cachedStore.set(key, key);
cachedStore.get('a');
cachedStore.get('b');
cachedStore.get('a'); // Promote a, so b is least recently used.
cachedStore.get('c'); // Evict b.
assert.equal(cachedStore.get('a').source, 'cache');
console.log('After reading a, b, a, c: b was evicted. Cache:', cachedStore.stats().cache);
now = 10;
assert.equal(cachedStore.get('a').source, 'primary');
console.log('At TTL expiry, a is fetched from storage again. Cache:', cachedStore.stats().cache);

console.log('\n3. Join node-d, moving only keys whose consistent-hash placement changes.');
console.log(store.joinNode('node-d'));
console.log('\n4. Gracefully remove node-b and preserve all six values.');
console.log(store.leaveNode('node-b'));
for (let index = 101; index <= 106; index++) assert.ok(store.get(`user:${index}`).value.name);
console.table(store.stats().nodes);

console.log('\n5. Larger sample: primary movement is clearer with 1,000 keys.');
const larger = new DistributedStore({ cache: { capacity: 0 } });
for (let index = 0; index < 1000; index++) larger.set(`sample:${index}`, { index });
console.log('Add a fourth node (roughly 25% expected; exact share depends on token placement):');
console.log(larger.joinNode('node-d'));
console.log('Remove that node:');
console.log(larger.leaveNode('node-d'));

console.log('\n6. Fail the primary for Alice; read from her replica.');
const placement = store.inspectKey('user:101');
store.clearCache();
store.failNode(placement.primary);
const fallback = store.get('user:101');
assert.equal(fallback.source, 'replica');
console.log('Same client request:', fallback);
try { store.set('user:101', { name: 'Updated Alice' }); }
catch (error) { console.log(`Write during failure: ${error.status} ${error.message}`); }

console.log('\n7. Fail both copies and clear cache to demonstrate limited availability.');
for (const id of placement.replicas) store.failNode(id);
console.log('A still-cached value can be served:', store.get('user:101'));
store.clearCache();
assert.throws(() => store.get('user:101'), { status: 503 });
try { store.get('user:101'); }
catch (error) { console.log(`Uncached read: ${error.status} ${error.message}`); }

console.log('\n8. Recover the nodes; the stored value is available again.');
for (const id of [placement.primary, ...placement.replicas]) store.recoverNode(id);
const recovered = store.get('user:101');
assert.equal(recovered.value.name, 'Alice');
console.log(recovered);
console.log('\nAll simulation checks passed. Cache statistics:', store.stats().cache);
