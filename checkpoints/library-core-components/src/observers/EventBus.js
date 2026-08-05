/** Lightweight Observer implementation; subscribers are infrastructure, not domain logic. */
export class EventBus {
  #listeners = new Map();

  subscribe(eventName, listener) {
    const listeners = this.#listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(eventName, listeners);
    return () => listeners.delete(listener);
  }

  publish(eventName, payload) {
    for (const listener of this.#listeners.get(eventName) ?? []) listener(payload);
  }
}
