import { MongoClient } from 'mongodb';
import { setupSchema } from '../src/schema.mjs';
import { seedCatalog, draftOrder } from '../src/fixtures.mjs';
import { placePaidOrder } from '../src/orders.mjs';
import { migrateInitial, refreshDailySales, topProducts } from '../src/analytics.mjs';

let temporary;
let client;
try {
  // No URI: start an isolated, disposable, single-member replica set.
  // This supports transactions, but does not demonstrate high availability.
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    temporary = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '8.0.17' } });
    uri = temporary.getUri();
  }
  client = new MongoClient(uri);
  await client.connect();
  const initial = client.db('ecommerce_initial');
  const refactored = client.db('ecommerce_refactored');
  await setupSchema(initial);
  await setupSchema(refactored, { refactored: true });
  await seedCatalog(initial);
  await placePaidOrder(client, initial, draftOrder());
  console.log('Catalog search:', await initial.collection('products').find({
    active: true, $text: { $search: 'wireless' },
  }, { projection: { name: 1, score: { $meta: 'textScore' } } }).sort({ score: { $meta: 'textScore' } }).toArray());
  await migrateInitial(initial, refactored);
  await placePaidOrder(client, refactored, draftOrder('order-002'), { refactored: true });
  await refreshDailySales(refactored, new Date('2026-10-01'), new Date('2026-10-02'));
  console.log('Top products (USD minor units):', await topProducts(refactored, {
    fromDay: '2026-10-01', toDay: '2026-10-02', currency: 'USD',
  }));
} finally {
  await client?.close();
  await temporary?.stop();
}
