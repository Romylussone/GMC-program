# Procedural Shopping Cart

A simple shopping cart built with procedural JavaScript. Cart data is held in a global `cart` variable and managed through functions.

## Run the example

```bash
node demo.js
```

## Available functions

- `addItem(name, quantity, price)` adds an item. If the name already exists, its quantity increases.
- `viewCart()` logs and returns formatted cart contents and the total in TND.
- `removeItem(name)` removes an item and returns whether it was found.
- `clearCart()` empties the cart.

## Short Reflection Report

The main challenge in this refactor was changing the way cart data is accessed without changing how the cart behaves for a user. In the procedural version, the `cart` array is a global variable, so every function can access and modify it directly. That approach is easy to understand for a small script, but it also means that other code could accidentally change the array. During the refactor, I needed to place the array inside a closure while keeping the same useful operations: adding items, viewing the cart, removing an item, and clearing it. I also had to make sure that each function could still share the same cart state even though the variable was no longer global.

Using the Module pattern improved the code by encapsulating the cart data. The `cart` array in `shoppingCartRefactor.js` is private, and consumers can only interact with it through the public methods returned by `ShoppingCart`. This reduces the risk of unwanted changes and makes the responsibilities of the code clearer. The module also provides one well-defined API, which makes it easier to reuse, test, or later extend with features such as discounts, saved carts, or stock validation.

I would choose procedural code for a very small, temporary program where simplicity is more important than structure. I would choose a design pattern when the application has shared state, more features, multiple developers, or a likely need for maintenance and growth. In this case, the Module pattern is a good middle ground: it adds protection and organization without making the shopping cart unnecessarily complex.
