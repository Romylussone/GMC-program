class Product {
  constructor(id, name, price) {
    this.id = id;
    this.name = name;
    this.price = price;
  }
}

class ShoppingCartItem {
  constructor(product, quantity = 1) {
    this.product = product;
    this.quantity = quantity;
  }

  calculateTotalPrice() {
    return this.product.price * this.quantity;
  }
}

class ShoppingCart {
  constructor() {
    this.items = [];
  }

  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice() {
    return this.items.reduce(
      (total, item) => total + item.calculateTotalPrice(),
      0
    );
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find((item) => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      return;
    }

    this.items.push(new ShoppingCartItem(product, quantity));
  }

  removeItem(productId) {
    this.items = this.items.filter((item) => item.product.id !== productId);
  }

  displayCartItems() {
    if (this.items.length === 0) {
      console.log("Your cart is empty.");
      return;
    }

    console.log("Cart items:");

    this.items.forEach((item) => {
      console.log(
        `${item.product.name} - $${item.product.price.toFixed(2)} x ${
          item.quantity
        } = $${item.calculateTotalPrice().toFixed(2)}`
      );
    });

    console.log(`Total items: ${this.getTotalItems()}`);
    console.log(`Cart total: $${this.getTotalPrice().toFixed(2)}`);
  }
}

const laptop = new Product(1, "Laptop", 1200);
const headphones = new Product(2, "Headphones", 150);
const mouse = new Product(3, "Mouse", 40);

const cart = new ShoppingCart();

cart.addItem(laptop, 1);
cart.addItem(headphones, 2);
cart.addItem(mouse, 3);
cart.addItem(headphones, 1);

cart.displayCartItems();

console.log("\nRemoving headphones from the cart...\n");
cart.removeItem(2);

cart.displayCartItems();
