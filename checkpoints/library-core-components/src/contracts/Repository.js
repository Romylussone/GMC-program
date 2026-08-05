/**
 * Interface-like repository contract. Implementations must provide the methods
 * below; keeping services dependent on this shape makes persistence replaceable.
 */
export class Repository {
  async findById(_id) { throw new Error('Repository.findById must be implemented'); }
  async save(_entity) { throw new Error('Repository.save must be implemented'); }
  async findAll() { throw new Error('Repository.findAll must be implemented'); }
}
