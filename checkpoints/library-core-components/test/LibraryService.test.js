import test from 'node:test';
import assert from 'node:assert/strict';
import { LibraryItemFactory } from '../src/factories/LibraryItemFactory.js';
import { Member } from '../src/domain/Member.js';
import { InMemoryRepository } from '../src/repositories/InMemoryRepository.js';
import { StandardLoanPolicy } from '../src/strategies/StandardLoanPolicy.js';
import { EventBus } from '../src/observers/EventBus.js';
import { LibraryService } from '../src/services/LibraryService.js';

test('borrowing persists a loan and publishes an event through injected collaborators', async () => {
  const book = LibraryItemFactory.create('book', { id: 'b1', title: 'Clean Code', author: 'Robert Martin', isbn: '1' });
  const member = new Member({ id: 'm1', name: 'Grace', email: 'grace@example.com' });
  const events = new EventBus();
  let publishedLoan;
  events.subscribe('loan.created', ({ loan }) => { publishedLoan = loan; });
  const service = new LibraryService({
    bookRepository: new InMemoryRepository([book]), memberRepository: new InMemoryRepository([member]), loanRepository: new InMemoryRepository(),
    loanPolicy: new StandardLoanPolicy(7), eventBus: events, clock: () => new Date('2026-01-10T00:00:00Z'), idGenerator: () => 'l1',
  });

  const loan = await service.borrowBook({ bookId: 'b1', memberId: 'm1' });
  assert.equal(book.available, false);
  assert.equal(loan.dueAt.toISOString(), '2026-01-17T00:00:00.000Z');
  assert.equal(publishedLoan, loan);
});

test('reference items are created by the factory and cannot be borrowed', async () => {
  const book = LibraryItemFactory.create('reference', { id: 'r1', title: 'Encyclopedia', author: 'Editors', isbn: '2' });
  const member = new Member({ id: 'm1', name: 'Grace', email: 'grace@example.com' });
  const service = new LibraryService({ bookRepository: new InMemoryRepository([book]), memberRepository: new InMemoryRepository([member]), loanRepository: new InMemoryRepository(), loanPolicy: new StandardLoanPolicy(), eventBus: new EventBus(), idGenerator: () => 'l1' });
  await assert.rejects(service.borrowBook({ bookId: 'r1', memberId: 'm1' }), /reference-only/);
});
