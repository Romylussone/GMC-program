// Real MongoDB validators and indexes, shared by the demo and integration tests.
const id = { bsonType: 'string', minLength: 1, maxLength: 128 };
const money = { bsonType: 'int', minimum: 0, maximum: 2_000_000_000 };
const currency = { enum: ['USD', 'EUR', 'XOF'] };
const date = { bsonType: 'date' };
const object = (required, properties) => ({
  bsonType: 'object', required, additionalProperties: false, properties,
});
const address = object(['line1', 'city', 'country'], {
  line1: { bsonType: 'string' }, city: { bsonType: 'string' },
  country: { bsonType: 'string', pattern: '^[A-Z]{2}$' },
});
const customer = object(['name', 'email', 'address'], {
  name: { bsonType: 'string' }, email: { bsonType: 'string' }, address,
});
const item = object(['lineId', 'productId', 'sku', 'name', 'quantity', 'unitPriceMinor'], {
  lineId: id, productId: id, sku: id, name: { bsonType: 'string' },
  quantity: { bsonType: 'int', minimum: 1, maximum: 1000 },
  unitPriceMinor: money,
});

export function orderSchema(version) {
  return object([
    '_id', 'schemaVersion', 'customerId', 'customer', 'items', 'currency',
    'totalMinor', 'paymentStatus', 'deliveryStatus', 'version', 'createdAt',
    'updatedAt', 'requestHash',
  ], {
    _id: id, schemaVersion: { enum: [version] }, customerId: id, customer,
    items: { bsonType: 'array', minItems: 1, maxItems: 100, items: item },
    currency, totalMinor: money, paymentStatus: { enum: ['paid'] },
    deliveryStatus: { enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'] },
    version: { bsonType: 'int', minimum: 0 }, createdAt: date, updatedAt: date,
    requestHash: { bsonType: 'string', pattern: '^[a-f0-9]{64}$' },
  });
}

export const factSchema = object([
  '_id', 'orderId', 'productId', 'currency', 'occurredAt', 'quantity', 'revenueMinor',
], {
  _id: id, orderId: id, productId: id, currency, occurredAt: date,
  // Negative facts reverse a sale. Facts must be appended, never edited/deleted.
  quantity: { bsonType: 'int', minimum: -1000, maximum: 1000 },
  revenueMinor: { bsonType: 'int', minimum: -2_000_000_000, maximum: 2_000_000_000 },
});

async function ensureCollection(db, name, schema) {
  const validator = { $jsonSchema: schema };
  if (await db.listCollections({ name }).hasNext()) {
    await db.command({ collMod: name, validator, validationLevel: 'strict', validationAction: 'error' });
  } else {
    await db.createCollection(name, { validator, validationLevel: 'strict', validationAction: 'error' });
  }
}

export async function setupSchema(db, { refactored = false } = {}) {
  await ensureCollection(db, 'users', object(['_id', 'name', 'email', 'address'], {
    _id: id, ...customer.properties,
  }));
  await ensureCollection(db, 'products', object([
    '_id', 'sku', 'name', 'description', 'category', 'priceMinor', 'currency', 'active',
  ], {
    _id: id, sku: id, name: { bsonType: 'string' }, description: { bsonType: 'string' },
    category: id, priceMinor: money, currency, active: { bsonType: 'bool' },
  }));
  await ensureCollection(db, 'orders', orderSchema(refactored ? 2 : 1));
  await db.collection('users').createIndex({ email: 1 }, { unique: true, name: 'email_unique' });
  await db.collection('products').createIndexes([
    { key: { sku: 1 }, unique: true, name: 'sku_unique' },
    { key: { active: 1, category: 1, priceMinor: 1, _id: 1 }, name: 'category_price' },
    { key: { name: 'text', description: 'text' }, weights: { name: 5, description: 1 }, name: 'catalog_text' },
  ]);
  await db.collection('orders').createIndex(
    { customerId: 1, createdAt: -1, _id: -1 }, { name: 'customer_history' },
  );
  if (refactored) {
    await ensureCollection(db, 'sales_facts', factSchema);
    await db.collection('sales_facts').createIndex({ occurredAt: 1 }, { name: 'event_window' });
    await ensureCollection(db, 'daily_product_sales', object([
      '_id', 'day', 'productId', 'currency', 'units', 'revenueMinor', 'refreshedAt',
    ], {
      _id: object(['day', 'productId', 'currency'], {
        day: { bsonType: 'string' }, productId: id, currency,
      }),
      day: { bsonType: 'string' }, productId: id, currency, refreshedAt: date,
      units: { bsonType: ['int', 'long', 'double'] },
      revenueMinor: { bsonType: ['int', 'long', 'double'] },
    }));
    await db.collection('daily_product_sales').createIndex(
      { currency: 1, day: 1, productId: 1 }, { name: 'trend_window' },
    );
  }
}
