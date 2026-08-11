/**
 * ShoppingCart module
 *
 * The cart array is private to this closure. Consumers can interact with it
 * only through the public methods returned by the module.
 */
const ShoppingCart = (() => {
  let cart = [];

  function addItem(name, quantity, price) {
    if (!name || quantity <= 0 || price < 0) {
      throw new Error("Please provide a name, a positive quantity, and a valid price.");
    }

    const existingItem = cart.find((item) => item.name === name);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ name, quantity, price });
    }
  }

  function viewCart() {
    if (cart.length === 0) {
      const emptyMessage = "Your cart is empty.";
      console.log(emptyMessage);
      return emptyMessage;
    }

    const lines = cart.map((item) => {
      const itemTotal = item.quantity * item.price;
      return `${item.name} (x${item.quantity}) - ${itemTotal.toFixed(2)} TND`;
    });

    const total = cart.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    lines.push(`Total: ${total.toFixed(2)} TND`);
    const output = lines.join("\n");
    console.log(output);
    return output;
  }

  function removeItem(name) {
    const itemIndex = cart.findIndex((item) => item.name === name);

    if (itemIndex === -1) {
      return false;
    }

    cart.splice(itemIndex, 1);
    return true;
  }

  function clearCart() {
    cart = [];
  }

  // Public API: the only way to access the private cart state.
  return { addItem, viewCart, removeItem, clearCart };
})();

module.exports = ShoppingCart;
