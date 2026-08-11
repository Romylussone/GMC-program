// Global cart data: each item has a name, quantity, and unit price.
let cart = [];

/**
 * Adds an item to the cart.
 * If the item is already present, its quantity is increased.
 */
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

/**
 * Returns and displays every cart item along with the total price.
 */
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

/**
 * Removes an item from the cart by name.
 */
function removeItem(name) {
  const itemIndex = cart.findIndex((item) => item.name === name);

  if (itemIndex === -1) {
    return false;
  }

  cart.splice(itemIndex, 1);
  return true;
}

/**
 * Removes all items from the cart.
 */
function clearCart() {
  cart = [];
}

// Export the functions so they can be used from another JavaScript file.
module.exports = { addItem, viewCart, removeItem, clearCart };
