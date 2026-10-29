export const user = {
  _id: 'customer-001', name: 'Alex Kouame', email: 'alex@example.test',
  address: { line1: '12 Market Street', city: 'Abidjan', country: 'CI' },
};
export const products = [
  {
    _id: 'product-001', sku: 'HEADPHONES-01', name: 'Wireless Headphones',
    description: 'Comfortable wireless audio for music and calls', category: 'electronics',
    priceMinor: 5000, currency: 'USD', active: true,
  },
  {
    _id: 'product-002', sku: 'MUG-01', name: 'Ceramic Mug',
    description: 'Reusable ceramic coffee mug', category: 'home',
    priceMinor: 1500, currency: 'USD', active: true,
  },
];

export function draftOrder(id = 'order-001') {
  return {
    _id: id, customerId: user._id,
    customer: { name: user.name, email: user.email, address: { ...user.address } },
    items: [
      { lineId: '1', productId: products[0]._id, sku: products[0].sku,
        name: products[0].name, quantity: 2, unitPriceMinor: products[0].priceMinor },
      { lineId: '2', productId: products[1]._id, sku: products[1].sku,
        name: products[1].name, quantity: 1, unitPriceMinor: products[1].priceMinor },
    ],
    currency: 'USD', createdAt: new Date('2026-10-01T10:00:00Z'),
  };
}

export async function seedCatalog(db) {
  await db.collection('users').updateOne({ _id: user._id }, { $setOnInsert: user }, { upsert: true });
  for (const product of products) {
    await db.collection('products').updateOne({ _id: product._id }, { $setOnInsert: product }, { upsert: true });
  }
}
