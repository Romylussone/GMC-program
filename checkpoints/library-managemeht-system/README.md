# Library Management System — Object-Oriented Analysis & Design

## 1. Scope and assumptions

This simplified system manages the library catalogue, member accounts, and the lending lifecycle of individual book copies. A librarian administers books, copies, members, and loans. Members browse/search the catalogue and view their own loans.

Business rules:

- A `Book` describes a title; a `BookCopy` is a physical lendable item.
- A copy may have one active loan at a time.
- Only active members may borrow books.
- A loan has a due date; returning it makes the copy available again.
- The default maximum active-loan limit is five per member (configurable).

## 2. Requirement analysis

### Actors

| Actor | Responsibilities |
|---|---|
| Member | Search the catalogue; view availability and personal loans. |
| Librarian | Manage catalogue and members; issue and return copies; manage reservations. |
| Administrator | Configure lending rules; manage librarian accounts; run reports. |

### Key use cases

| Use case | Primary actor | Outcome |
|---|---|---|
| Search catalogue | Member, Librarian | Matching books and available-copy counts are displayed. |
| Register/update member | Librarian | A valid member profile is created or amended. |
| Add book/copy | Librarian | A bibliographic record and/or physical copy is added. |
| Issue book | Librarian | An available copy is assigned to an eligible member with a due date. |
| Return book | Librarian | An active loan is closed; late fee is recorded if applicable. |
| Reserve book | Member, Librarian | A request is queued when no copy is available. |
| Configure policies/report | Administrator | Rules or operational information are maintained/generated. |

### Use-case diagram

```mermaid
flowchart LR
  member([Member])
  librarian([Librarian])
  admin([Administrator])
  search((Search catalogue))
  account((View loans / reserve book))
  memberMgmt((Manage members))
  catalogue((Manage books and copies))
  issue((Issue book))
  returnBook((Return book))
  policies((Configure policies / reports))

  member --> search
  member --> account
  librarian --> search
  librarian --> memberMgmt
  librarian --> catalogue
  librarian --> issue
  librarian --> returnBook
  librarian --> account
  admin --> policies
```

## 3. Architecture design

The system uses a layered architecture. The presentation layer has no direct database access; the application layer coordinates use cases; the domain layer owns business rules; repositories hide persistence technology.

```mermaid
flowchart TB
  ui[Presentation layer\nWeb/desktop UI or REST API]
  auth[Authentication & authorization]
  services[Application layer\nCatalogService · CirculationService\nMemberService · ReportingService]
  domain[Domain layer\nBook · BookCopy · Member · Loan\nReservation · LendingPolicy]
  repos[Data-access layer\nBookRepository · MemberRepository\nLoanRepository]
  db[(Library database)]
  notify[Notification gateway]

  ui --> auth --> services
  services --> domain
  services --> repos --> db
  services --> notify
```

Component responsibilities:

- **Presentation:** validates basic input, presents results, and enforces role-aware navigation.
- **Application services:** start transactions, load aggregates, apply a use case, and persist changes.
- **Domain:** models state and invariants such as borrow eligibility and copy availability.
- **Data access:** maps domain objects to durable storage.
- **Infrastructure:** supplies notifications, authentication, and database integration.

## 4. Object-oriented analysis

```mermaid
classDiagram
  class Book {
    +String isbn
    +String title
    +String author
    +String subject
    +int publicationYear
    +availableCopyCount() int
  }
  class BookCopy {
    +String barcode
    +CopyStatus status
    +String shelfLocation
    +markIssued()
    +markReturned()
    +markLost()
  }
  class Member {
    +String memberId
    +String name
    +String email
    +MemberStatus status
    +int activeLoanCount
    +canBorrow(policy) bool
  }
  class Loan {
    +String loanId
    +Date issuedOn
    +Date dueOn
    +Date returnedOn
    +LoanStatus status
    +close(returnDate)
    +isOverdue(today) bool
    +calculateFine(policy, today) Decimal
  }
  class Reservation {
    +String reservationId
    +Date requestedOn
    +ReservationStatus status
    +fulfil()
    +cancel()
  }
  class LendingPolicy {
    +int maximumLoans
    +int loanPeriodDays
    +Decimal dailyLateFee
    +createDueDate(issueDate) Date
  }
  class CirculationService {
    +issue(copyBarcode, memberId) Loan
    +returnCopy(copyBarcode) Decimal
  }
  class CatalogService {
    +search(query) List~Book~
    +addCopy(isbn, barcode)
  }
  Book "1" o-- "0..*" BookCopy : describes
  Book "1" <-- "0..*" Reservation : requested for
  Member "1" <-- "0..*" Reservation : makes
  Member "1" <-- "0..*" Loan : borrows
  BookCopy "1" <-- "0..*" Loan : loan history
  CirculationService ..> LendingPolicy
  CirculationService ..> Loan
  CatalogService ..> Book
```

`Book` and `BookCopy` are deliberately separate: changing the availability of one physical copy must not change the title-level information. Services orchestrate work; entities protect their own valid state transitions.

## 5. Interaction diagrams

### Issue book

```mermaid
sequenceDiagram
  actor L as Librarian
  participant UI as UI/API
  participant C as CirculationService
  participant MR as MemberRepository
  participant CR as CopyRepository
  participant P as LendingPolicy
  participant LR as LoanRepository
  L->>UI: issue(memberId, barcode)
  UI->>C: issue(barcode, memberId)
  C->>MR: findById(memberId)
  C->>CR: findByBarcode(barcode)
  C->>C: validate active member, limit, copy available
  C->>P: createDueDate(today)
  C->>C: create Loan
  C->>CR: save(copy.markIssued())
  C->>LR: save(loan)
  C-->>UI: issue receipt / due date
```

### Return book

```mermaid
sequenceDiagram
  actor L as Librarian
  participant UI as UI/API
  participant C as CirculationService
  participant LR as LoanRepository
  participant CR as CopyRepository
  participant P as LendingPolicy
  L->>UI: return(barcode)
  UI->>C: returnCopy(barcode)
  C->>LR: findActiveByCopy(barcode)
  C->>P: calculateFine(loan, today)
  C->>C: loan.close(today)
  C->>CR: save(copy.markReturned())
  C->>LR: save(closed loan)
  C-->>UI: return confirmation + fine
```

## 6. Data, functional, and behavioral models

### Data model

| Entity | Key data | Relationships |
|---|---|---|
| Book | ISBN, title, author, subject, publication year | One book has zero or more copies. |
| BookCopy | barcode, ISBN, status, shelf location | Belongs to one book; has loan history. |
| Member | member ID, name, email, status | Has loans and reservations. |
| Loan | loan ID, barcode, member ID, issue/due/return dates, status | Links one member and one copy. |
| Reservation | reservation ID, ISBN, member ID, requested date, status | Links a member to a book title. |

Suggested integrity constraints: unique ISBN, barcode, member ID, and loan ID; one active loan per `BookCopy`; `returnedOn` required only for closed loans.

### Functional model

```mermaid
flowchart LR
  request[User request] --> validate[Authenticate and validate input]
  validate --> route{Use case}
  route --> catalog[Search/manage catalogue]
  route --> circulation[Issue/return copy]
  route --> members[Manage members]
  catalog --> store[(Persist/read data)]
  circulation --> rules[Apply lending policy]
  rules --> store
  members --> store
  store --> result[Result, receipt, or error]
```

### Book-copy state diagram

```mermaid
stateDiagram-v2
  [*] --> Available : copy added
  Available --> Issued : issue to eligible member
  Issued --> Available : returned
  Issued --> Overdue : due date passes
  Overdue --> Available : returned and fine assessed
  Available --> Reserved : reservation allocated
  Reserved --> Issued : collected/issued
  Reserved --> Available : reservation expires/cancelled
  Available --> Lost : inventory marks lost
  Issued --> Lost : declared lost
  Lost --> [*]
```

## 7. Abstraction to implementation

The following pseudocode keeps domain rules inside the relevant objects and leaves persistence to repositories.

```text
class BookCopy:
    barcode
    status = AVAILABLE

    method issue():
        if status != AVAILABLE:
            raise CopyNotAvailable
        status = ISSUED

    method returnToLibrary():
        if status not in [ISSUED, OVERDUE]:
            raise InvalidReturn
        status = AVAILABLE

class Member:
    method canBorrow(policy):
        return status == ACTIVE and activeLoanCount < policy.maximumLoans

class CirculationService:
    method issue(barcode, memberId):
        member = memberRepository.get(memberId)
        copy = copyRepository.get(barcode)
        if not member.canBorrow(policy):
            raise BorrowingNotAllowed
        copy.issue()
        loan = Loan.new(member, copy, today, policy.createDueDate(today))
        transaction.save(copy, loan)
        return loan

    method returnCopy(barcode):
        loan = loanRepository.getActiveForCopy(barcode)
        fine = loan.calculateFine(policy, today)
        loan.close(today)
        loan.copy.returnToLibrary()
        transaction.save(loan.copy, loan)
        return fine
```

## 8. Implementation boundary and next steps

This design intentionally stops before a full build. The next implementation increment should establish the domain classes and repository interfaces, then implement `search`, `issue`, and `return` with automated tests for availability, loan limits, and overdue handling.
