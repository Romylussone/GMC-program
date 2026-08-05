import { Loan } from '../domain/Loan.js';

/**
 * Application service. Every collaborator is injected, allowing a database,
 * message broker, fake clock, or alternate policy to be substituted in tests.
 */
export class LibraryService {
  constructor({ bookRepository, memberRepository, loanRepository, loanPolicy, eventBus, clock = () => new Date(), idGenerator }) {
    Object.assign(this, { bookRepository, memberRepository, loanRepository, loanPolicy, eventBus, clock, idGenerator });
  }

  async borrowBook({ bookId, memberId }) {
    const [book, member, loans] = await Promise.all([
      this.bookRepository.findById(bookId), this.memberRepository.findById(memberId), this.loanRepository.findAll(),
    ]);
    if (!book) throw new Error('Book not found');
    if (!member) throw new Error('Member not found');
    const activeLoans = loans.filter((loan) => loan.memberId === memberId && loan.isActive);
    const decision = this.loanPolicy.canBorrow(book, member, activeLoans);
    if (!decision.allowed) throw new Error(decision.reason);

    const borrowedAt = this.clock();
    book.checkout();
    const loan = new Loan({ id: this.idGenerator('loan'), bookId, memberId, borrowedAt, dueAt: this.loanPolicy.dueDate(borrowedAt) });
    await Promise.all([this.bookRepository.save(book), this.loanRepository.save(loan)]);
    this.eventBus.publish('loan.created', { loan, book, member });
    return loan;
  }

  async returnBook(loanId) {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) throw new Error('Loan not found');
    const book = await this.bookRepository.findById(loan.bookId);
    loan.returnOn(this.clock());
    book.checkin();
    await Promise.all([this.loanRepository.save(loan), this.bookRepository.save(book)]);
    this.eventBus.publish('loan.returned', { loan, book });
    return loan;
  }
}
