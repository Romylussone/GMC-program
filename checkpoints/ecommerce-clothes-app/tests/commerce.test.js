import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceOrder, orderSchema } from '../server/commerce.js';
import { products } from '../shared/catalog.js';

const item = (id = 'chemise-arthur', quantity = 1) => {
  const product = products.find((p) => p.id === id);
  return { productId: id, size: product.sizes[0], color: product.colors[0].name, quantity };
};
const customer = {
  name: 'Client Test',
  email: 'test@example.com',
  address: '12 rue de Test',
  city: 'Paris',
  postalCode: '75001',
  country: 'France',
};

test('prices are authoritative and client-supplied totals are ignored', () => {
  const result = priceOrder([{ ...item(), price: 1 }]);
  assert.equal(result.subtotal, 6900);
  assert.equal(result.shipping, 590);
  assert.equal(result.total, 7490);
});
test('free delivery applies at exactly 100 euros', () => {
  const catalog = [{ ...products[2], price: 10000 }];
  assert.equal(priceOrder([item()], catalog).shipping, 0);
  assert.equal(priceOrder([item('manteau-gabrielle')]).shipping, 0);
});
test('quantities affect totals in integer cents', () => {
  const result = priceOrder([item('chemise-arthur', 2), item('maille-camille')]);
  assert.equal(result.subtotal, 21700);
  assert.equal(result.total, 21700);
});
test('unknown products, invalid sizes and invalid colors are refused', () => {
  assert.throws(() => priceOrder([{ ...item(), productId: 'fake' }]), /variante/);
  assert.throws(() => priceOrder([{ ...item(), size: 'XXXL' }]), /variante/);
  assert.throws(() => priceOrder([{ ...item(), color: 'Rouge' }]), /variante/);
});
test('duplicate variants cannot bypass quantity limits', () => {
  assert.throws(() => priceOrder([item(), item()]), /seule fois/);
});
test('checkout validates consent, quantity, email and delivery country', () => {
  const valid = { customer, items: [item()], consent: true, idempotencyKey: crypto.randomUUID() };
  assert.ok(orderSchema.safeParse(valid).success);
  assert.equal(orderSchema.safeParse({ ...valid, consent: false }).success, false);
  assert.equal(
    orderSchema.safeParse({ ...valid, items: [item('chemise-arthur', 11)] }).success,
    false,
  );
  assert.equal(
    orderSchema.safeParse({ ...valid, items: [item('chemise-arthur', -1)] }).success,
    false,
  );
  assert.equal(
    orderSchema.safeParse({ ...valid, customer: { ...customer, email: 'invalid' } }).success,
    false,
  );
  assert.equal(
    orderSchema.safeParse({ ...valid, customer: { ...customer, country: 'Unknown' } }).success,
    false,
  );
});
