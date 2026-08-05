# Simplified Library Management System

Run the example with:

```bash
node library-system.js
```

The reusable classes are exported from `library-system.js`.

- `User` is an abstract base class; `Student` and `Teacher` set different loan limits and durations.
- `UserFactory` implements the Factory Pattern for user creation.
- `LibrarySystem.getInstance()` implements the Singleton Pattern.
- `NotificationService` provides Observer-style overdue notifications through `User.update()`.

Typical usage:

```js
const { Book, LibrarySystem, UserFactory } = require("./library-system");

const library = LibrarySystem.getInstance();
const user = UserFactory.createUser("teacher", "T-01", "Morgan Lee");
library.addUser(user);
library.addBook(new Book("B-01", "Dune", "Frank Herbert"));

const loan = library.borrowBook("T-01", "B-01");
library.markTransactionOverdue(loan.id); // simulates an overdue notification
library.returnBook(loan.id);
```
