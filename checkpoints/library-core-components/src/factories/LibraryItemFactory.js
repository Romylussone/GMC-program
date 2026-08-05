import { Book } from '../domain/Book.js';

/** Factory centralizes construction and makes adding item types non-invasive. */
export class LibraryItemFactory {
  static create(type, attributes) {
    switch (type) {
      case 'book': return new Book(attributes);
      case 'reference': return new Book({ ...attributes, category: 'reference', loanable: false });
      default: throw new Error(`Unsupported library item type: ${type}`);
    }
  }
}
