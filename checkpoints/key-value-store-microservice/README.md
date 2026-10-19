# Distributed key-value storage simulation

A dependency-free Node.js project demonstrating consistent hashing, dynamic membership, caching, replication, and limited availability. The six supplied users (Alice through Frank) are loaded automatically by the demo and HTTP server.

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm run demo
npm test
npm start
```

The API listens at `http://127.0.0.1:3000`. Set `PORT` to change the port. Stop it with Ctrl+C. If your environment runs Node directly, the equivalent commands are `node demo.js`, `node --test`, and `node server.js`.

## How it works

Clients send a key to one coordinator. It hashes the key, finds its owner, reads from storage or cache, and returns the value. Clients never choose a node and continue using the same key after membership changes or a primary failure.

| Requirement | Implementation |
| --- | --- |
| Consistent hashing | SHA-256 reduced to a 32-bit position; 128 virtual tokens per physical node. A key belongs to the first token clockwise, wrapping around the ring. |
| Node join/leave | Recompute placements and copy only newly required replicas. Keep unchanged copies in place; remove obsolete copies after copying. Return movement counts. |
| Caching | Coordinator LRU cache: 100 entries, 30-second TTL from insertion. Hits promote recency without extending TTL. Expired entries are removed lazily. |
| Failure handling | Store two copies on distinct physical nodes. Read from the primary, then an available replica. A valid cached value can serve reads even when both copies are down. |
| Transparency | One CRUD API routes requests internally. The optional `source` field illustrates cache/primary/replica reads without revealing a node address. |

Writes and deletes require **all owners of that key** to be available. They update every copy synchronously and invalidate its cached entry. A rejected write changes neither copies nor cache. This avoids serving stale replicas after recovery. Failure of an unrelated node does not block those writes.

Failures do not remove nodes from the ring. This preserves the known replica placement and prevents silently assigning a key to an empty node. Recover failed nodes before joining or gracefully leaving. A graceful leave copies data while the departing node is healthy. The last node cannot leave. Clusters smaller than the configured replication factor use as many distinct nodes as are available.

## What the demo shows

1. Placement of `user:101` through `user:106` on three nodes.
2. Repeated reads needing only one storage lookup, plus deterministic LRU eviction and TTL expiry examples.
3. A fourth node joining, with primary movement and replica-copy counts.
4. A graceful departure preserving the six users.
5. A larger 1,000-key example: adding `node-d` moves **235 primary keys (23.5%)**, rather than redistributing every key. Removing it restores the original placement.
6. Failure of Alice's primary, followed by a successful replica read and a rejected write.
7. Failure of both copies: a cache hit succeeds; clearing the cache makes the same read fail with 503.
8. Recovery restores access to Alice's original value.

With just six keys, a new node may receive no primary keys; the demo reports that actual result. Roughly `1 / (N + 1)` primary movement on join is an expectation for evenly distributed keys and tokens, not a guarantee. Replica movement is counted separately because placing a second copy can change even when the primary stays the same. Rebalancing scans all stored keys in this educational implementation, but transfers only changed copies.

Cache hits avoid simulated storage lookups; `operations.storageReads` measures this directly. All nodes are local maps, so this demo does not claim a network latency benchmark.

## HTTP API

Key values are JSON, including objects, arrays, scalars, and `null`. Send the value itself as the PUT body. URL-encode keys or node IDs when constructing paths (`user:101` may be written as `user%3A101`). New keys and updates both return 200.

| Method | Path | Purpose / body |
| --- | --- | --- |
| GET | `/health` | Coordinator liveness; check stats for node availability |
| PUT | `/v1/kv/{key}` | Create or replace a JSON value, e.g. `{"name":"Alice"}` |
| GET | `/v1/kv/{key}` | Read `{ "key": "...", "value": ..., "source": "primary\|replica\|cache" }` |
| DELETE | `/v1/kv/{key}` | Delete the value and invalidate cache |
| GET | `/admin/stats` | Node distribution, cache counters, and storage operation counts |
| GET | `/admin/keys/{key}` | Inspect computed primary, replicas, and existing copies |
| POST | `/admin/nodes` | Join with body `{"id":"node-d"}`; returns 201 and movement report |
| DELETE | `/admin/nodes/{id}` | Gracefully leave; returns movement report |
| POST | `/admin/nodes/{id}/fail` | Mark a node unavailable |
| POST | `/admin/nodes/{id}/recover` | Mark a node available again |
| DELETE | `/admin/cache` | Clear cached entries to observe uncached failure behavior |

Responses use JSON. Errors include an `error` message: 400 for invalid input, 404 for missing keys/nodes/routes, 409 for duplicate membership or removing the final node, 413 for bodies over 1 MiB, and 503 for unavailable reads/writes or unsafe membership changes. Key inspection shows routing even when the key has never been stored; its `copies` array is then empty.

Try CRUD in PowerShell with the server running:

```powershell
$base = 'http://127.0.0.1:3000'
Invoke-RestMethod "$base/v1/kv/user:101"
Invoke-RestMethod "$base/v1/kv/user:107" -Method Put -ContentType 'application/json' -Body '{"name":"Grace"}'
Invoke-RestMethod "$base/v1/kv/user:107"
Invoke-RestMethod "$base/v1/kv/user:107" -Method Delete
Invoke-RestMethod "$base/admin/nodes" -Method Post -ContentType 'application/json' -Body '{"id":"node-d"}'
Invoke-RestMethod "$base/admin/stats"
```

Simulate a primary failure without guessing which node owns Alice:

```powershell
$placement = Invoke-RestMethod "$base/admin/keys/user:101"
Invoke-RestMethod "$base/admin/nodes/$($placement.primary)/fail" -Method Post
Invoke-RestMethod "$base/admin/cache" -Method Delete
Invoke-RestMethod "$base/v1/kv/user:101" # source: replica
Invoke-RestMethod "$base/admin/nodes/$($placement.primary)/recover" -Method Post
```

Admin endpoints are intended for local experiments and need no authentication. The default listener is loopback only.

## Use the store directly

```js
import { DistributedStore } from './src/store.js';

const store = new DistributedStore({
  nodes: ['node-a', 'node-b', 'node-c'],
  replicationFactor: 2,
  virtualNodes: 128,
  cache: { capacity: 100, ttlMs: 30_000 }, // capacity: 0 disables caching
});

store.set('user:101', { name: 'Alice' });
console.log(store.get('user:101').value);
console.log(store.joinNode('node-d'));
console.log(store.leaveNode('node-b'));
```

## Scope and validation

This is a **single-process, in-memory simulation**. Restarting loses all data and reloads only the six fixtures. A simulated failed node retains its map for recovery; permanent disk loss, process networking, partitions, consensus, concurrent coordinators, and automatic repair are outside its scope. The coordinator is a single point of failure. Writes favor consistency over availability when a required replica is down; two replicas cannot guarantee reads through arbitrary multiple failures. Cache TTL limits how long cached values remain available without storage access.

`npm test` checks ring routing and wraparound, distinct replicas, exact join/leave placement invariants over 1,000 keys, replica-count changes, cache eviction/expiry/invalidation, failure recovery, mutation isolation, and the real HTTP interface including error responses. The demo also asserts key behaviors and exits unsuccessfully if those checks fail.

Source files: `src/hash-ring.js` (routing), `src/cache.js` (LRU/TTL), `src/store.js` (cluster), `server.js` (HTTP), `demo.js` (guided simulation), and `data/users.json` (fixtures).
