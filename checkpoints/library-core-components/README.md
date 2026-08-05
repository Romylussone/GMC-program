# Library core components

A dependency-free ES-module Node.js example focused on composable library domain logic.

## Run

```sh
npm test
npm start
```

## Architecture

- `domain/`: entities with local state and invariants.
- `contracts/`: interface-like base contracts for swappable repositories and loan policies.
- `factories/`: Factory pattern for library-item construction.
- `strategies/`: Strategy pattern for borrowing rules; add policies without changing `LibraryService`.
- `observers/`: Observer pattern event bus for side effects such as notifications/auditing.
- `repositories/`: an in-memory contract implementation; replace with a database adapter.
- `services/`: orchestration layer with every dependency injected via its constructor.
- `utils/`: small reusable, framework-free helpers.

`LibraryService` accepts repositories, a policy, event bus, clock, and ID generator. Tests inject deterministic alternatives, while production can supply database adapters and real infrastructure.
