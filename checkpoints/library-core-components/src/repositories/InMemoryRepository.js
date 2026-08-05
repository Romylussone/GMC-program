import { Repository } from '../contracts/Repository.js';

export class InMemoryRepository extends Repository {
  #items = new Map();
  constructor(initialItems = []) { super(); initialItems.forEach((item) => this.#items.set(item.id, item)); }
  async findById(id) { return this.#items.get(id) ?? null; }
  async save(entity) { this.#items.set(entity.id, entity); return entity; }
  async findAll() { return [...this.#items.values()]; }
}
