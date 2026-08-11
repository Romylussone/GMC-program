import { NoDiscount } from '../discount/DiscountStrategies.js';
import { PriceDropNotifier } from '../notifications/PriceDropNotifier.js';

/** Iteration 3: coordinates cart state; pricing and notifications remain separate. */
export class ShoppingCart {
  #lines = new Map();

  constructor({ discountStrategy = new NoDiscount(), priceDropNotifier = new PriceDropNotifier() } = {}) {
    this.discountStrategy = discountStrategy;
    this.priceDropNotifier = priceDropNotifier;
  }

  add(product, quantity = 1) {
    this.#assertQuantity(quantity);
    const line = this.#lines.get(product.id);
    this.#lines.set(product.id, { product, quantity: (line?.quantity ?? 0) + quantity });
    return this;
  }

  remove(productId) { return this.#lines.delete(productId); }

  updateQuantity(productId, quantity) {
    this.#assertQuantity(quantity);
    const line = this.#requiredLine(productId);
    this.#lines.set(productId, { ...line, quantity });
    return this;
  }

  updateProductPrice(productId, newPrice) {
    if (!Number.isFinite(newPrice) || newPrice < 0) throw new Error('Price must be a non-negative number.');
    const line = this.#requiredLine(productId);
    const oldPrice = line.product.price;
    const product = line.product.withPrice(newPrice);
    this.#lines.set(productId, { ...line, product });
    if (newPrice < oldPrice) this.priceDropNotifier.notify(product, oldPrice);
    return product;
  }

  get subtotal() { return [...this.#lines.values()].reduce((sum, line) => sum + line.product.price * line.quantity, 0); }
  get discount() { return Math.min(this.discountStrategy.calculate(this.subtotal), this.subtotal); }
  get total() { return this.subtotal - this.discount; }
  get items() { return [...this.#lines.values()].map((line) => ({ ...line })); }

  #requiredLine(productId) {
    const line = this.#lines.get(productId);
    if (!line) throw new Error(`No product with id "${productId}" is in the cart.`);
    return line;
  }

  #assertQuantity(quantity) {
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Quantity must be a positive integer.');
  }
}
