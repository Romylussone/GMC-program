export class LruCache {
  #entries = new Map();

  constructor({ capacity = 100, ttlMs = 30_000, now = Date.now } = {}) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new TypeError('Cache capacity must be a non-negative integer');
    }
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new TypeError('Cache TTL must be positive');
    }
    this.capacity = capacity;
    this.ttlMs = ttlMs;
    this.now = now;
    this.metrics = { hits: 0, misses: 0, evictions: 0, expirations: 0 };
  }

  get(key) {
    const entry = this.#entries.get(key);
    if (!entry) {
      this.metrics.misses++;
      return { hit: false };
    }
    if (entry.expiresAt <= this.now()) {
      this.#entries.delete(key);
      this.metrics.expirations++;
      this.metrics.misses++;
      return { hit: false };
    }
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    this.metrics.hits++;
    return { hit: true, value: structuredClone(entry.value) };
  }

  set(key, value) {
    if (this.capacity === 0) return;
    this.#entries.delete(key);
    this.#entries.set(key, {
      value: structuredClone(value),
      expiresAt: this.now() + this.ttlMs,
    });
    if (this.#entries.size > this.capacity) {
      this.#entries.delete(this.#entries.keys().next().value);
      this.metrics.evictions++;
    }
  }

  delete(key) { this.#entries.delete(key); }
  clear() { this.#entries.clear(); }

  stats() {
    // Expiry is lazy; report only live entries even when they were never read again.
    for (const [key, entry] of this.#entries) {
      if (entry.expiresAt <= this.now()) {
        this.#entries.delete(key);
        this.metrics.expirations++;
      }
    }
    return { ...this.metrics, size: this.#entries.size, capacity: this.capacity, ttlMs: this.ttlMs };
  }
}
