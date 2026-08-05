export class Loan {
  constructor({ id, bookId, memberId, borrowedAt, dueAt }) {
    Object.assign(this, { id, bookId, memberId, borrowedAt, dueAt, returnedAt: null });
  }

  get isActive() { return this.returnedAt === null; }
  returnOn(date) { if (!this.isActive) throw new Error('Loan has already been returned'); this.returnedAt = date; }
}
