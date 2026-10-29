import { createHash } from 'node:crypto';

export const writeConcern = { w: 'majority', j: true, wtimeoutMS: 10_000 };
const transitions = {
  placed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'],
  shipped: ['delivered'], delivered: [], cancelled: [],
};

function canonical(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

export function prepareOrder(draft, schemaVersion) {
  if (!draft.items?.length || draft.items.length > 100) throw new Error('Use 1–100 line items');
  const lineIds = new Set();
  let totalMinor = 0;
  for (const item of draft.items) {
    if (lineIds.has(item.lineId)) throw new Error('Duplicate lineId');
    lineIds.add(item.lineId);
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000 ||
        !Number.isInteger(item.unitPriceMinor) || item.unitPriceMinor < 0) {
      throw new Error('Invalid quantity or price');
    }
    totalMinor += item.quantity * item.unitPriceMinor;
  }
  if (!Number.isSafeInteger(totalMinor) || totalMinor > 2_000_000_000) throw new Error('Order total too large');
  const requestHash = createHash('sha256').update(JSON.stringify(canonical(draft))).digest('hex');
  return {
    ...draft, schemaVersion, totalMinor, paymentStatus: 'paid', deliveryStatus: 'placed',
    version: 0, updatedAt: draft.createdAt, requestHash,
  };
}

export function factsForOrder(order) {
  return order.items.map(item => ({
    _id: createHash('sha256').update(JSON.stringify([order._id, item.lineId, 'sale'])).digest('hex'),
    orderId: order._id, productId: item.productId,
    currency: order.currency, occurredAt: order.createdAt,
    quantity: item.quantity, revenueMinor: item.quantity * item.unitPriceMinor,
  }));
}

// The caller supplies a stable UUID order ID and the same draft on retries.
// Payment authorization and stock reservation are external prerequisites.
export async function placePaidOrder(client, db, draft, { refactored = false } = {}) {
  const order = prepareOrder(draft, refactored ? 2 : 1);
  const session = client.startSession({ causalConsistency: true });
  try {
    if (refactored) {
      await session.withTransaction(async () => {
        await db.collection('orders').insertOne(order, { session });
        await db.collection('sales_facts').insertMany(factsForOrder(order), { session });
      }, { readConcern: { level: 'snapshot' }, writeConcern, readPreference: 'primary' });
    } else {
      await db.collection('orders').insertOne(order, { session, writeConcern });
    }
    return order;
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await db.collection('orders').findOne({ _id: order._id }, {
      session, readConcern: { level: 'majority' }, readPreference: 'primary',
    });
    if (!existing || existing.requestHash !== order.requestHash) {
      throw new Error('Idempotency conflict: order ID already used with different input', { cause: error });
    }
    return existing;
  } finally {
    await session.endSession();
  }
}

export async function advanceDelivery(db, { orderId, expectedVersion, from, to }, { session } = {}) {
  if (!transitions[from]?.includes(to)) throw new Error('Invalid delivery transition');
  const result = await db.collection('orders').updateOne({
    _id: orderId, version: expectedVersion, deliveryStatus: from,
  }, {
    $set: { deliveryStatus: to, updatedAt: new Date() }, $inc: { version: 1 },
  }, { session, writeConcern });
  if (result.modifiedCount !== 1) throw new Error('Order missing or version conflict');
}
