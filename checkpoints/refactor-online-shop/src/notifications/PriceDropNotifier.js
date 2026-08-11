/** Observer subject: subscribers can be functions or objects with onPriceDrop. */
export class PriceDropNotifier {
  #observers = new Set();

  subscribe(observer) {
    if (typeof observer !== 'function' && typeof observer?.onPriceDrop !== 'function') {
      throw new TypeError('An observer must be a function or provide onPriceDrop.');
    }
    this.#observers.add(observer);
    return () => this.#observers.delete(observer);
  }

  notify(product, oldPrice) {
    const event = Object.freeze({ product, oldPrice, newPrice: product.price });
    for (const observer of this.#observers) {
      if (typeof observer === 'function') observer(event);
      else observer.onPriceDrop(event);
    }
  }
}
