import { LibraryItemFactory } from './factories/LibraryItemFactory.js';
import { Member } from './domain/Member.js';
import { InMemoryRepository } from './repositories/InMemoryRepository.js';
import { StandardLoanPolicy } from './strategies/StandardLoanPolicy.js';
import { EventBus } from './observers/EventBus.js';
import { LibraryService } from './services/LibraryService.js';
import { createId } from './utils/id.js';

const book = LibraryItemFactory.create('book', { id: 'book-1', title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719' });
const member = new Member({ id: 'member-1', name: 'Ada Lovelace', email: 'ada@example.com' });
const events = new EventBus();
events.subscribe('loan.created', ({ loan }) => console.log(`Loan ${loan.id} created; due ${loan.dueAt.toISOString().slice(0, 10)}`));

const library = new LibraryService({
  bookRepository: new InMemoryRepository([book]), memberRepository: new InMemoryRepository([member]),
  loanRepository: new InMemoryRepository(), loanPolicy: new StandardLoanPolicy(), eventBus: events, idGenerator: createId,
});
await library.borrowBook({ bookId: book.id, memberId: member.id });
