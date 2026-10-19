import { HashRing } from './hash-ring.js';
import { LruCache } from './cache.js';

export class StoreError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'StoreError';
    this.status = status;
  }
}

function validateId(id, label) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new StoreError(`${label} must be a non-empty string`);
  }
}

function cloneJson(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || ancestors.has(value) ||
      (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) {
    throw new StoreError('Values must contain only JSON data without cycles');
  }
  ancestors.add(value);
  const result = Array.isArray(value)
    ? Array.from(value, (item) => cloneJson(item, ancestors))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJson(item, ancestors)]));
  ancestors.delete(value);
  return result;
}

// One coordinator hides routing, replicas, failover, and caching from clients.
// Node maps simulate independent storage processes; failed nodes retain their data.
export class DistributedStore {
  #nodes = new Map();
  #ring;
  #cache;
  #replicationFactor;
  #virtualNodes;
  #metrics = { storageReads: 0, replicaReads: 0, writes: 0, deletes: 0 };

  constructor({ nodes = ['node-a', 'node-b', 'node-c'], replicationFactor = 2,
    virtualNodes = 128, cache = {} } = {}) {
    if (!Number.isInteger(replicationFactor) || replicationFactor < 1) {
      throw new TypeError('replicationFactor must be a positive integer');
    }
    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new TypeError('At least one node is required');
    }
    this.#ring = new HashRing(nodes, virtualNodes);
    this.#virtualNodes = virtualNodes;
    this.#replicationFactor = replicationFactor;
    this.#cache = new LruCache(cache);
    for (const id of nodes) this.#nodes.set(id, { available: true, data: new Map() });
  }

  #owners(key) { return this.#ring.owners(key, this.#replicationFactor); }

  #writableOwners(key) {
    const owners = this.#owners(key);
    if (owners.some((id) => !this.#nodes.get(id).available)) {
      throw new StoreError('A replica is unavailable; write rejected to preserve consistency', 503);
    }
    return owners;
  }

  set(key, value) {
    validateId(key, 'Key');
    const copy = cloneJson(value);
    const owners = this.#writableOwners(key);
    for (const id of owners) this.#nodes.get(id).data.set(key, structuredClone(copy));
    this.#cache.delete(key);
    this.#metrics.writes++;
    return { key, value: structuredClone(copy) };
  }

  get(key) {
    validateId(key, 'Key');
    const cached = this.#cache.get(key);
    if (cached.hit) return { key, value: cached.value, source: 'cache' };
    const owners = this.#owners(key);
    const live = owners.filter((id) => this.#nodes.get(id).available);
    if (live.length === 0) throw new StoreError('All replicas for this key are unavailable', 503);
    for (const id of live) {
      this.#metrics.storageReads++;
      const data = this.#nodes.get(id).data;
      if (data.has(key)) {
        const value = structuredClone(data.get(key));
        this.#cache.set(key, value);
        const source = id === owners[0] ? 'primary' : 'replica';
        if (source === 'replica') this.#metrics.replicaReads++;
        return { key, value, source };
      }
    }
    throw new StoreError('Key not found', 404);
  }

  delete(key) {
    validateId(key, 'Key');
    const owners = this.#writableOwners(key);
    const existed = owners.some((id) => this.#nodes.get(id).data.has(key));
    for (const id of owners) this.#nodes.get(id).data.delete(key);
    this.#cache.delete(key);
    if (!existed) throw new StoreError('Key not found', 404);
    this.#metrics.deletes++;
    return { key, deleted: true };
  }

  #node(id) {
    validateId(id, 'Node ID');
    const node = this.#nodes.get(id);
    if (!node) throw new StoreError('Node not found', 404);
    return node;
  }

  failNode(id) {
    this.#node(id).available = false;
    return { id, available: false };
  }

  recoverNode(id) {
    this.#node(id).available = true;
    return { id, available: true };
  }

  #requireHealthyTopology() {
    if ([...this.#nodes.values()].some((node) => !node.available)) {
      throw new StoreError('Recover failed nodes before changing cluster membership', 503);
    }
  }

  joinNode(id) {
    validateId(id, 'Node ID');
    if (this.#nodes.has(id)) throw new StoreError('Node already exists', 409);
    this.#requireHealthyTopology();
    const nextRing = new HashRing([...this.#nodes.keys(), id], this.#virtualNodes);
    this.#nodes.set(id, { available: true, data: new Map() });
    return this.#rebalance(nextRing);
  }

  leaveNode(id) {
    this.#node(id);
    if (this.#nodes.size === 1) throw new StoreError('Cannot remove the last node', 409);
    this.#requireHealthyTopology();
    const nextRing = new HashRing([...this.#nodes.keys()].filter((key) => key !== id), this.#virtualNodes);
    const report = this.#rebalance(nextRing);
    this.#nodes.delete(id);
    return report;
  }

  #rebalance(nextRing) {
    const keys = new Set([...this.#nodes.values()].flatMap((node) => [...node.data.keys()]));
    const report = { totalKeys: keys.size, primaryKeysMoved: 0, copiesAdded: 0, copiesRemoved: 0 };
    for (const key of keys) {
      const before = this.#owners(key);
      const after = nextRing.owners(key, this.#replicationFactor);
      if (before[0] !== after[0]) report.primaryKeysMoved++;
      const value = this.#nodes.get(before[0]).data.get(key);
      // Copy new placements before deleting old ones. Unchanged copies are untouched.
      for (const id of after) {
        if (!before.includes(id)) {
          this.#nodes.get(id).data.set(key, structuredClone(value));
          report.copiesAdded++;
        }
      }
      for (const id of before) {
        if (!after.includes(id)) {
          this.#nodes.get(id).data.delete(key);
          report.copiesRemoved++;
        }
      }
    }
    this.#ring = nextRing;
    return { ...report,
      primaryMovementPercent: keys.size === 0 ? 0 : Number((100 * report.primaryKeysMoved / keys.size).toFixed(2)),
    };
  }

  clearCache() { this.#cache.clear(); }

  inspectKey(key) {
    validateId(key, 'Key');
    const owners = this.#owners(key);
    return { key, primary: owners[0], replicas: owners.slice(1),
      copies: [...this.#nodes].filter(([, node]) => node.data.has(key)).map(([id]) => id),
    };
  }

  stats() {
    const primaryCounts = new Map([...this.#nodes.keys()].map((id) => [id, 0]));
    const keys = new Set([...this.#nodes.values()].flatMap((node) => [...node.data.keys()]));
    for (const key of keys) {
      const primary = this.#owners(key)[0];
      primaryCounts.set(primary, primaryCounts.get(primary) + 1);
    }
    return {
      totalKeys: keys.size,
      replicationFactor: this.#replicationFactor,
      effectiveReplicationFactor: Math.min(this.#replicationFactor, this.#nodes.size),
      virtualNodesPerNode: this.#virtualNodes,
      nodes: [...this.#nodes].map(([id, node]) => ({ id, available: node.available,
        primaryKeys: primaryCounts.get(id), storedCopies: node.data.size })),
      cache: this.#cache.stats(),
      operations: { ...this.#metrics },
    };
  }
}
