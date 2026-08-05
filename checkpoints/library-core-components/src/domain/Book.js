export class Book {
  constructor({ id, title, author, isbn, category = 'general', loanable = true }) {
    if (!id || !title || !author || !isbn) throw new Error('Book requires id, title, author, and isbn');
    Object.assign(this, { id, title, author, isbn, category, loanable, available: true });
  }

  checkout() {
    if (!this.loanable) throw new Error(`"${this.title}" is not available for loan`);
    if (!this.available) throw new Error(`"${this.title}" is already checked out`);
    this.available = false;
  }

  checkin() { this.available = true; }
}
