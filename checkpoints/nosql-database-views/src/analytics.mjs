import { factsForOrder, writeConcern } from './orders.mjs';

export async function refreshDailySales(db, from, to) {
  for (const value of [from, to]) {
    if (!(value instanceof Date) || !Number.isFinite(+value) || value.toISOString().slice(11) !== '00:00:00.000Z') {
      throw new Error('Refresh boundaries must be UTC midnights');
    }
  }
  if (from >= to) throw new Error('Refresh window must be nonempty');
  await db.collection('sales_facts').aggregate([
    { $match: { occurredAt: { $gte: from, $lt: to } } },
    { $group: {
      _id: {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt', timezone: 'UTC' } },
        productId: '$productId', currency: '$currency',
      },
      units: { $sum: '$quantity' }, revenueMinor: { $sum: '$revenueMinor' },
    } },
    { $set: {
      day: '$_id.day', productId: '$_id.productId', currency: '$_id.currency', refreshedAt: '$$NOW',
    } },
    // Replace totals, rather than incrementing them: retrying cannot double-count.
    { $merge: { into: 'daily_product_sales', on: '_id', whenMatched: 'replace', whenNotMatched: 'insert' } },
  ], { allowDiskUse: true, readConcern: { level: 'majority' }, writeConcern }).toArray();
}

export async function topProducts(db, { fromDay, toDay, currency, limit = 10 }) {
  return db.collection('daily_product_sales').aggregate([
    { $match: { currency, day: { $gte: fromDay, $lt: toDay } } },
    { $group: { _id: '$productId', units: { $sum: '$units' }, revenueMinor: { $sum: '$revenueMinor' } } },
    { $sort: { revenueMinor: -1, _id: 1 } }, { $limit: limit },
  ]).toArray();
}

// Offline migration: pause initial writers, copy to a NEW refactored database,
// reconcile, then cut over. Never upgrades the source or deletes data.
export async function migrateInitial(source, target) {
  if (source.databaseName === target.databaseName) throw new Error('Use separate source and target databases');
  for (const name of ['users', 'products']) {
    for await (const document of source.collection(name).find()) {
      await target.collection(name).replaceOne({ _id: document._id }, document, { upsert: true, writeConcern });
    }
  }
  for await (const order of source.collection('orders').find()) {
    await target.collection('orders').replaceOne({ _id: order._id }, {
      ...order, schemaVersion: 2,
    }, { upsert: true, writeConcern });
    for (const fact of factsForOrder(order)) {
      await target.collection('sales_facts').updateOne({ _id: fact._id }, {
        $setOnInsert: fact,
      }, { upsert: true, writeConcern });
    }
  }
}
