import test from 'node:test';
import assert from 'node:assert/strict';
import { ProductBuilder } from '../src/domain/Product.js';
import { FixedAmountDiscount, PercentageDiscount } from '../src/discount/DiscountStrategies.js';
import { PriceDropNotifier } from '../src/notifications/PriceDropNotifier.js';
import { ShoppingCart } from '../src/cart/ShoppingCart.js';

const keyboard = () => new ProductBuilder('kbd-1', 'Mechanical Keyboard', 100)
  .inCategory('electronics').withSku('KEY-001').withAttribute('layout', 'ANSI').tagged('office', 'gaming').build();

test('builder creates an immutable product with optional details', () => {
  const product = keyboard();
  assert.equal(product.attributes.layout, 'ANSI');
  assert.deepEqual(product.tags, ['office', 'gaming']);
  assert.throws(() => new ProductBuilder('', 'Missing id', 1).build());
});

test('cart aggregates quantities and delegates percentage discount calculation', () => {
  const cart = new ShoppingCart({ discountStrategy: new PercentageDiscount(20) });
  cart.add(keyboard(), 2);
  assert.equal(cart.subtotal, 200);
  assert.equal(cart.discount, 40);
  assert.equal(cart.total, 160);
});

test('fixed discount never reduces total below zero', () => {
  const cart = new ShoppingCart({ discountStrategy: new FixedAmountDiscount(150) });
  cart.add(keyboard());
  assert.equal(cart.total, 0);
});

test('price-drop observers are notified only when the price decreases', () => {
  const events = [];
  const notifier = new PriceDropNotifier();
  notifier.subscribe((event) => events.push(event));
  const cart = new ShoppingCart({ priceDropNotifier: notifier });
  cart.add(keyboard());
  cart.updateProductPrice('kbd-1', 85);
  cart.updateProductPrice('kbd-1', 90);
  assert.equal(events.length, 1);
  assert.equal(events[0].oldPrice, 100);
  assert.equal(events[0].newPrice, 85);
});
