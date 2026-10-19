import { createHash } from 'node:crypto';

export function hash(value) {
  return createHash('sha256').update(value).digest().readUInt32BE(0);
}

// Virtual nodes spread each physical node across the hash space.
export class HashRing {
  constructor(nodeIds = [], virtualNodes = 128) {
    if (!Number.isInteger(virtualNodes) || virtualNodes < 1) {
      throw new TypeError('virtualNodes must be a positive integer');
    }
    this.virtualNodes = virtualNodes;
    this.nodeIds = [...nodeIds];
    if (new Set(nodeIds).size !== nodeIds.length ||
        nodeIds.some((id) => typeof id !== 'string' || !id.trim())) {
      throw new TypeError('Node IDs must be unique non-empty strings');
    }
    this.tokens = nodeIds.flatMap((nodeId) =>
      Array.from({ length: virtualNodes }, (_, index) => ({
        position: hash(JSON.stringify([nodeId, index])),
        nodeId,
        index,
      })),
    ).sort((a, b) => a.position - b.position ||
      a.nodeId.localeCompare(b.nodeId, 'en') || a.index - b.index);
  }

  owners(key, count = 1) {
    if (!Number.isInteger(count) || count < 1) {
      throw new TypeError('Owner count must be a positive integer');
    }
    if (this.tokens.length === 0) return [];
    const position = hash(key);
    let low = 0;
    let high = this.tokens.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (this.tokens[middle].position < position) low = middle + 1;
      else high = middle;
    }
    const owners = new Set();
    const wanted = Math.min(count, this.nodeIds.length);
    for (let offset = 0; offset < this.tokens.length && owners.size < wanted; offset++) {
      owners.add(this.tokens[(low + offset) % this.tokens.length].nodeId);
    }
    return [...owners];
  }
}
