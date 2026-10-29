import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setupSchema } from '../src/schema.mjs';
import { draftOrder, seedCatalog } from '../src/fixtures.mjs';
import { advanceDelivery, factsForOrder, placePaidOrder, prepareOrder } from '../src/orders.mjs';
import { migrateInitial, refreshDailySales, topProducts } from '../src/analytics.mjs';

let server;
let client;
let initial;
let refactored;
before(async () => {
  server = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '8.0.17' } });
  client = new MongoClient(server.getUri());
  await client.connect();
  initial = client.db('test_initial');
  refactored = client.db('test_refactored');
  await setupSchema(initial);
  await setupSchema(refactored, { refactored: true });
  await seedCatalog(initial);
}, { timeout: 300_000 });

after(async () => {
  await client?.close();
  await server?.stop();
});

test('catalog supports full-text search, category lookup and unique SKU', async () => {
  const found = await initial.collection('products').find({ $text: { $search: 'wireless' } }).toArray();
  assert.deepEqual(found.map(product => product._id), ['product-001']);
  const browsed = await initial.collection('products').find({ active: true, category: 'electronics' })
    .sort({ priceMinor: 1, _id: 1 }).toArray();
  assert.equal(browsed[0].priceMinor, 5000);
  await assert.rejects(initial.collection('products').insertOne({ ...found[0], _id: 'duplicate' }), { code: 11000 });
});

test('validators reject missing snapshots and invalid quantities; app checks totals', async () => {
  await assert.rejects(initial.collection('orders').insertOne({ _id: 'bad' }), { code: 121 });
  const draft = draftOrder('invalid-quantity');
  draft.items[0].quantity = -1;
  assert.throws(() => prepareOrder(draft, 1), /Invalid quantity/);
  const invalid = prepareOrder(draftOrder('schema-invalid'), 1);
  invalid.items[0].quantity = 0;
  await assert.rejects(initial.collection('orders').insertOne(invalid), { code: 121 });
});

test('initial order is idempotent and snapshots survive catalog changes', async () => {
  const draft = draftOrder();
  const order = await placePaidOrder(client, initial, draft);
  assert.equal(order.totalMinor, 11500);
  await placePaidOrder(client, initial, draft);
  assert.equal(await initial.collection('orders').countDocuments(), 1);
  const changed = structuredClone(draft);
  changed.items[0].quantity = 3;
  await assert.rejects(placePaidOrder(client, initial, changed), /Idempotency conflict/);
  await initial.collection('products').updateOne({ _id: 'product-001' }, { $set: { priceMinor: 8000 } });
  assert.equal((await initial.collection('orders').findOne({ _id: draft._id })).items[0].unitPriceMinor, 5000);
});

test('competing status updates cannot both overwrite the same version', async () => {
  const args = { orderId: 'order-001', expectedVersion: 0, from: 'placed', to: 'processing' };
  const results = await Promise.allSettled([
    advanceDelivery(initial, args), advanceDelivery(initial, { ...args, to: 'cancelled' }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await initial.collection('orders').findOne({ _id: args.orderId })).version, 1);
  await assert.rejects(advanceDelivery(initial, { ...args, from: 'delivered', to: 'placed' }), /Invalid delivery/);
});

test('offline migration can be rerun without duplicating facts or changing totals', async () => {
  await migrateInitial(initial, refactored);
  await migrateInitial(initial, refactored);
  assert.equal(await refactored.collection('orders').countDocuments(), 1);
  assert.equal(await refactored.collection('sales_facts').countDocuments(), 2);
  assert.equal((await refactored.collection('orders').findOne({ _id: 'order-001' })).schemaVersion, 2);
  assert.equal((await initial.collection('orders').findOne({ _id: 'order-001' })).schemaVersion, 1);
});

test('refactored transaction and duplicate retry produce one order and one fact per line', async () => {
  const draft = draftOrder('order-002');
  await placePaidOrder(client, refactored, draft, { refactored: true });
  await placePaidOrder(client, refactored, draft, { refactored: true });
  assert.equal(await refactored.collection('sales_facts').countDocuments({ orderId: draft._id }), 2);
});

test('a fact insert failure rolls the entire order transaction back', async () => {
  const draft = draftOrder('rollback-order');
  const conflict = factsForOrder(prepareOrder(draft, 2))[0];
  await refactored.collection('sales_facts').insertOne(conflict);
  await assert.rejects(placePaidOrder(client, refactored, draft, { refactored: true }), /Idempotency conflict/);
  assert.equal(await refactored.collection('orders').countDocuments({ _id: draft._id }), 0);
  await refactored.collection('sales_facts').deleteOne({ _id: conflict._id });
});

test('rollups are replay-safe, handle late facts and zero-net reversals, and separate currencies', async () => {
  const from = new Date('2026-10-01');
  const to = new Date('2026-10-02');
  await refreshDailySales(refactored, from, to);
  await refreshDailySales(refactored, from, to);
  let top = await topProducts(refactored, { fromDay: '2026-10-01', toDay: '2026-10-02', currency: 'USD' });
  assert.deepEqual(top, [
    { _id: 'product-001', units: 4, revenueMinor: 20000 },
    { _id: 'product-002', units: 2, revenueMinor: 3000 },
  ]);
  const adjustments = [
    { _id: 'refund-headphones', orderId: 'order-001', productId: 'product-001', currency: 'USD',
      occurredAt: from, quantity: -4, revenueMinor: -20000 },
    { _id: 'euro-sale', orderId: 'external-euro-order', productId: 'product-002', currency: 'EUR',
      occurredAt: from, quantity: 1, revenueMinor: 9000 },
    { _id: 'late-sale', orderId: 'external-late-order', productId: 'product-002', currency: 'USD',
      occurredAt: from, quantity: 1, revenueMinor: 1500 },
    { _id: 'next-day-sale', orderId: 'external-next-order', productId: 'product-002', currency: 'USD',
      occurredAt: to, quantity: 1, revenueMinor: 1500 },
  ];
  await refactored.collection('sales_facts').insertMany(adjustments);
  await refreshDailySales(refactored, from, to);
  top = await topProducts(refactored, { fromDay: '2026-10-01', toDay: '2026-10-02', currency: 'USD' });
  assert.deepEqual(top, [
    { _id: 'product-002', units: 3, revenueMinor: 4500 },
    { _id: 'product-001', units: 0, revenueMinor: 0 },
  ]);
  assert.equal(await refactored.collection('daily_product_sales').countDocuments(), 3);
  await assert.rejects(refreshDailySales(refactored, new Date('2026-10-01T10:00Z'), to), /UTC midnights/);
});
