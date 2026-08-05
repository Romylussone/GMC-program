"use strict";

/**
 * Abstract base class for all library members.
 * Subclasses define their own borrowing limits and loan periods.
 */
class User {
  constructor(id, name) {
    if (new.target === User) {
      throw new Error("User is abstract. Create a Student or Teacher instead.");
    }

    if (!id || !name) {
      throw new Error("A user needs both an id and a name.");
    }

    this.id = id;
    this.name = name;
    this._borrowedBookIds = new Set();
    this.notifications = [];
  }

  get maxBooks() {
    throw new Error("Subclasses must define maxBooks.");
  }

  get loanPeriodDays() {
    throw new Error("Subclasses must define loanPeriodDays.");
  }

  get borrowedBookIds() {
    return [...this._borrowedBookIds];
  }

  canBorrow() {
    return this._borrowedBookIds.size < this.maxBooks;
  }

  _addBorrowedBook(bookId) {
    this._borrowedBookIds.add(bookId);
  }

  _removeBorrowedBook(bookId) {
    this._borrowedBookIds.delete(bookId);
  }

  // Observer callback used by NotificationService.
  update(message) {
    this.notifications.push(message);
  }
}

class Student extends User {
  get maxBooks() {
    return 3;
  }

  get loanPeriodDays() {
    return 14;
  }
}

class Teacher extends User {
  get maxBooks() {
    return 10;
  }

  get loanPeriodDays() {
    return 30;
  }
}

/** Factory Pattern: centralizes creation of concrete user types. */
class UserFactory {
  static createUser(type, id, name) {
    const userType = String(type).toLowerCase();

    if (userType === "student") return new Student(id, name);
    if (userType === "teacher") return new Teacher(id, name);

    throw new Error(`Unsupported user type: ${type}`);
  }
}

class Book {
  constructor(id, title, author) {
    if (!id || !title || !author) {
      throw new Error("A book needs an id, title, and author.");
    }

    this.id = id;
    this.title = title;
    this.author = author;
    this.isAvailable = true;
  }

  borrow() {
    if (!this.isAvailable) throw new Error(`"${this.title}" is unavailable.`);
    this.isAvailable = false;
  }

  returnToLibrary() {
    this.isAvailable = true;
  }
}

class BorrowTransaction {
  constructor(id, userId, bookId, dueDate) {
    this.id = id;
    this.userId = userId;
    this.bookId = bookId;
    this.borrowedAt = new Date();
    this.dueDate = dueDate;
    this.returnedAt = null;
    this.isOverdue = false;
  }

  get isActive() {
    return this.returnedAt === null;
  }

  markReturned() {
    if (!this.isActive) throw new Error("This transaction has already been closed.");
    this.returnedAt = new Date();
  }

  markOverdue() {
    if (!this.isActive) throw new Error("Returned books cannot be marked overdue.");
    this.isOverdue = true;
  }
}

/**
 * Observer Pattern subject. Users receive a message through their update method.
 */
class NotificationService {
  notifyOverdue(user, book, transaction) {
    const dueDate = transaction.dueDate.toISOString().slice(0, 10);
    user.update(`Overdue: return "${book.title}" (was due ${dueDate}).`);
  }
}

/** Singleton Pattern: one central catalogue and transaction manager. */
class LibrarySystem {
  static #instance;
  static #constructionToken = Symbol("LibrarySystem");

  static getInstance() {
    if (!LibrarySystem.#instance) {
      LibrarySystem.#instance = new LibrarySystem(LibrarySystem.#constructionToken);
    }
    return LibrarySystem.#instance;
  }

  constructor(token) {
    if (token !== LibrarySystem.#constructionToken) {
      throw new Error("Use LibrarySystem.getInstance() to access the library.");
    }

    this.users = new Map();
    this.books = new Map();
    this.transactions = new Map();
    this.notificationService = new NotificationService();
    this._nextTransactionId = 1;
  }

  addUser(user) {
    if (!(user instanceof User)) throw new Error("Only User instances can be registered.");
    if (this.users.has(user.id)) throw new Error(`User id ${user.id} already exists.`);
    this.users.set(user.id, user);
    return user;
  }

  addBook(book) {
    if (!(book instanceof Book)) throw new Error("Only Book instances can be added.");
    if (this.books.has(book.id)) throw new Error(`Book id ${book.id} already exists.`);
    this.books.set(book.id, book);
    return book;
  }

  borrowBook(userId, bookId) {
    const user = this.#requireUser(userId);
    const book = this.#requireBook(bookId);
    if (!user.canBorrow()) throw new Error(`${user.name} reached their borrowing limit.`);

    book.borrow();
    user._addBorrowedBook(book.id);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + user.loanPeriodDays);
    const transaction = new BorrowTransaction(this._nextTransactionId++, user.id, book.id, dueDate);
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  returnBook(transactionId) {
    const transaction = this.#requireTransaction(transactionId);
    if (!transaction.isActive) throw new Error("This transaction has already been closed.");

    const user = this.#requireUser(transaction.userId);
    const book = this.#requireBook(transaction.bookId);
    transaction.markReturned();
    book.returnToLibrary();
    user._removeBorrowedBook(book.id);
    return transaction;
  }

  viewBorrowedBooks(userId) {
    const user = this.#requireUser(userId);
    return user.borrowedBookIds.map((bookId) => this.books.get(bookId));
  }

  // Makes overdue handling deterministic for a demo or an automated test.
  markTransactionOverdue(transactionId) {
    const transaction = this.#requireTransaction(transactionId);
    transaction.markOverdue();
    this.notificationService.notifyOverdue(
      this.#requireUser(transaction.userId),
      this.#requireBook(transaction.bookId),
      transaction,
    );
    return transaction;
  }

  #requireUser(id) {
    const user = this.users.get(id);
    if (!user) throw new Error(`No user found for id ${id}.`);
    return user;
  }

  #requireBook(id) {
    const book = this.books.get(id);
    if (!book) throw new Error(`No book found for id ${id}.`);
    return book;
  }

  #requireTransaction(id) {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error(`No transaction found for id ${id}.`);
    return transaction;
  }
}

module.exports = {
  User,
  Student,
  Teacher,
  UserFactory,
  Book,
  BorrowTransaction,
  NotificationService,
  LibrarySystem,
};

if (require.main === module) {
  const library = LibrarySystem.getInstance();
  const student = UserFactory.createUser("student", "S-101", "Amina");
  library.addUser(student);
  library.addBook(new Book("B-001", "Clean Code", "Robert C. Martin"));

  const loan = library.borrowBook(student.id, "B-001");
  console.log(library.viewBorrowedBooks(student.id).map((book) => book.title));
  library.markTransactionOverdue(loan.id);
  console.log(student.notifications);
  library.returnBook(loan.id);
}
