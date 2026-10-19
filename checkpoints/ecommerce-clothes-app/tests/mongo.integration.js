import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import mongoose from 'mongoose';

const databaseName = `maison_test_${randomBytes(8).toString('hex')}`;
const baseUri =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27137/?replicaSet=rs0&directConnection=true';
const parsed = new URL(baseUri);
if (!['127.0.0.1', 'localhost'].includes(parsed.hostname))
  throw new Error('Integration tests require an isolated local MongoDB instance.');
parsed.pathname = `/${databaseName}`;
process.env.MONGODB_URI = parsed.toString();
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.ENABLE_ORDERS = 'true';
const { default: app } = await import('../server/app.js');
const { connectDatabase } = await import('../server/db.js');
const { Product, User, Order, Subscriber } = await import('../server/models.js');
const { products, variantKey } = await import('../shared/catalog.js');
let agent;
const password = 'Test-Strong-Password-2026';
const validOrder = (product = products[0], quantity = 1) => ({
  customer: {
    name: 'Client Test',
    email: 'client@example.com',
    address: '12 rue de Test',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
  },
  items: [
    { productId: product.id, size: product.sizes[0], color: product.colors[0].name, quantity },
  ],
  consent: true,
  idempotencyKey: crypto.randomUUID(),
});

before(async () => {
  await connectDatabase();
  await Promise.all([Product.init(), User.init(), Order.init(), Subscriber.init()]);
  for (const { id, ...product } of products)
    await Product.create({
      _id: id,
      ...product,
      inventory: product.sizes.flatMap((size) =>
        product.colors.map((color) => ({ key: variantKey(size, color.name), stock: 12 })),
      ),
    });
  agent = request.agent(app);
});
after(async () => {
  // Only ever drop the unique, disposable database created by this test file.
  if (mongoose.connection.name === databaseName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('MongoDB catalog exposes inventory and marks live mode', async () => {
  const response = await request(app).get('/api/products').expect(200);
  assert.equal(response.body.demo, false);
  assert.equal(response.body.products.length, 8);
  assert.ok(response.body.products[0].inventory.length > 0);
  assert.equal(response.body.products.find((p) => p.id === products[0].id).newArrival, true);
});
test('accounts hash passwords, set HttpOnly cookies, log in and log out', async () => {
  const response = await agent
    .post('/api/auth/register')
    .send({ name: 'Client Test', email: 'CLIENT@example.com', password })
    .expect(201);
  assert.equal(response.body.user.email, 'client@example.com');
  assert.equal(response.body.user.password, undefined);
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);
  assert.match(response.headers['set-cookie'][0], /SameSite=Strict/);
  const stored = await User.findOne({ email: 'client@example.com' }).select('+password');
  assert.notEqual(stored.password, password);
  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.email, 'client@example.com');
  await agent.post('/api/auth/logout').expect(200);
  assert.equal((await agent.get('/api/auth/me')).body.user, null);
  await agent
    .post('/api/auth/login')
    .send({ email: 'client@example.com', password: 'wrong-password' })
    .expect(401);
  await agent.post('/api/auth/login').send({ email: 'client@example.com', password }).expect(200);
});
test('duplicate registrations are rejected', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Another Client', email: 'client@example.com', password })
    .expect(409);
});
test('confirmed orders persist, reserve stock once and appear only to their owner', async () => {
  const body = validOrder();
  const response = await agent
    .post('/api/orders')
    .send({ ...body, total: 1 })
    .expect(201);
  assert.equal(response.body.total, products[0].price);
  assert.equal(response.body.demo, false);
  assert.match(response.body.reference, /^MSN-/);
  const retry = await agent.post('/api/orders').send(body).expect(201);
  assert.equal(retry.body.reference, response.body.reference);
  assert.equal(await Order.countDocuments(), 1);
  const product = await Product.findById(products[0].id).lean();
  assert.equal(product.inventory[0].stock, 11);
  const history = await agent.get('/api/orders').expect(200);
  assert.equal(history.body.orders.length, 1);
  const another = request.agent(app);
  await another
    .post('/api/auth/register')
    .send({ name: 'Other Client', email: 'other@example.com', password })
    .expect(201);
  assert.equal((await another.get('/api/orders')).body.orders.length, 0);
  await another.post('/api/orders').send(body).expect(409);
});
test('failed reservations roll back all inventory changes and do not create an order', async () => {
  await Product.updateOne({ _id: products[1].id }, { $set: { 'inventory.0.stock': 0 } });
  const body = validOrder();
  body.items.push(validOrder(products[1]).items[0]);
  await agent.post('/api/orders').send(body).expect(409);
  const product = await Product.findById(products[0].id).lean();
  assert.equal(product.inventory[0].stock, 11);
  assert.equal(await Order.countDocuments(), 1);
});
test('concurrent checkouts cannot oversell the last unit', async () => {
  await Product.updateOne({ _id: products[2].id }, { $set: { 'inventory.0.stock': 1 } });
  const responses = await Promise.all([
    request(app).post('/api/orders').send(validOrder(products[2])),
    request(app).post('/api/orders').send(validOrder(products[2])),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  const product = await Product.findById(products[2].id).lean();
  assert.equal(product.inventory[0].stock, 0);
  assert.equal(await Order.countDocuments(), 2);
});
test('newsletter registrations are persistent and idempotent', async () => {
  for (let i = 0; i < 2; i++) {
    const result = await request(app)
      .post('/api/newsletter')
      .send({ email: 'newsletter@example.com', consent: true })
      .expect(200);
    assert.equal(result.body.demo, false);
  }
  assert.equal(await Subscriber.countDocuments(), 1);
});
