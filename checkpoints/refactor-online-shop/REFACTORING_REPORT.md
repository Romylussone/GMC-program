# Shopping Cart Refactoring Report

## Starting-point smells

The archived `src/archive/iteration-0-messy-cart.js` intentionally combines product storage, cart mutation, discount rules, and email delivery. It uses global mutable state, short names, duplicated multiplication, primitive product objects, and one long, branching method. Those choices make change risky: another discount or delivery channel requires modifying the same function.

## Iterative changes

1. **Iteration 1 — clarify and extract:** preserved the rough baseline for comparison, then gave concepts explicit names (`ShoppingCart`, `Product`, `quantity`, `subtotal`) and separated product validation from cart operations.
2. **Iteration 2 — Strategy:** moved discount algorithms to `DiscountStrategies.js`. The cart now depends only on a `calculate(subtotal)` capability, so percentage, fixed, and no-discount policies are interchangeable without cart conditionals.
3. **Iteration 3 — Observer:** added `PriceDropNotifier`. The cart emits a price-drop event but knows nothing about email, UI, or logging subscribers. Observers may unsubscribe using the returned function.
4. **Iteration 4 — Builder:** added `ProductBuilder` for readable construction of products with optional SKU, category, attributes, and tags. `Product` is immutable, and `withPrice` returns a replacement value rather than mutating a shared object.

## Clean-code outcomes

- Each module has one focused responsibility.
- Validation is kept near the data or operation it protects.
- Encapsulated cart lines prevent external mutation of internal collection state.
- Small public methods replace a long procedural flow; private helpers centralize repeated validation and missing-line handling.
- Node's built-in test runner verifies the builder, both discount variants, totals, and observer behavior with no third-party dependency.

## Verification

Run `node --test` (or `npm test`) and `npm run check` from the project root.
