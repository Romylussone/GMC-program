import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// The demo suite never reads or modifies the developer's real database.
process.env.MONGODB_URI = '';
process.env.APP_ORIGIN = 'http://localhost:5173';
const { default: app } = await import('../server/app.js');
const { products } = await import('../shared/catalog.js');
const product = products[0];
const validOrder = () => ({
  customer: {
    name: 'Client Test',
    email: 'test@example.com',
    address: '12 rue de Test',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
  },
  items: [
    { productId: product.id, size: product.sizes[0], color: product.colors[0].name, quantity: 1 },
  ],
  consent: true,
  idempotencyKey: crypto.randomUUID(),
});

test('health explicitly identifies the demonstration mode', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.demo, true);
  assert.equal(response.body.ordersEnabled, false);
});
test('catalog is available without MongoDB', async () => {
  const response = await request(app).get('/api/products').expect(200);
  assert.equal(response.body.products.length, 8);
  assert.equal(response.body.demo, true);
  assert.equal(response.headers['x-powered-by'], undefined);
  assert.equal(response.headers['cache-control'], 'no-store');
});
test('demo checkout computes totals without recording personal data', async () => {
  const response = await request(app)
    .post('/api/orders')
    .send({ ...validOrder(), total: 1 })
    .expect(201);
  assert.equal(response.body.total, product.price);
  assert.equal(response.body.demo, true);
  assert.match(response.body.reference, /^DEMO-/);
  assert.equal(response.body.customer, undefined);
});
test('checkout rejects manipulated products and excessive quantities', async () => {
  const body = validOrder();
  await request(app)
    .post('/api/orders')
    .send({ ...body, items: [{ ...body.items[0], productId: 'missing' }] })
    .expect(400);
  await request(app)
    .post('/api/orders')
    .send({ ...body, items: [{ ...body.items[0], quantity: 11 }] })
    .expect(400);
  await request(app)
    .post('/api/orders')
    .send({ ...body, consent: false })
    .expect(400);
});
test('cross-origin writes are rejected and same-origin dev writes work', async () => {
  await request(app)
    .post('/api/orders')
    .set('Origin', 'https://untrusted.example')
    .send(validOrder())
    .expect(403);
  await request(app)
    .post('/api/orders')
    .set('Origin', 'http://localhost:5173')
    .send(validOrder())
    .expect(201);
});
test('account creation requires a configured database', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Client Test', email: 'test@example.com', password: 'a-strong-password' })
    .expect(503);
  assert.match(response.body.error, /MongoDB/);
});
test('anonymous users cannot access order history', async () => {
  await request(app).get('/api/orders').expect(401);
  const response = await request(app).get('/api/auth/me').expect(200);
  assert.equal(response.body.user, null);
});
test('newsletter requires email and consent and identifies simulation', async () => {
  const response = await request(app)
    .post('/api/newsletter')
    .send({ email: 'test@example.com', consent: true })
    .expect(200);
  assert.equal(response.body.demo, true);
  await request(app).post('/api/newsletter').send({ email: 'invalid', consent: true }).expect(400);
  await request(app)
    .post('/api/newsletter')
    .send({ email: 'test@example.com', consent: false })
    .expect(400);
});
test('invalid JSON and unknown endpoints receive JSON errors', async () => {
  const invalid = await request(app)
    .post('/api/orders')
    .set('Content-Type', 'application/json')
    .send('{broken')
    .expect(400);
  assert.ok(invalid.body.error);
  const missing = await request(app).get('/api/missing').expect(404);
  assert.ok(missing.body.error);
});

test('Vercel and Netlify entry points expose the same API', async () => {
  const { default: vercelApp } = await import('../api/index.js');
  assert.equal(vercelApp, app);
  const { handler } = await import('../netlify/functions/api.js');
  const result = await handler(
    {
      httpMethod: 'GET',
      path: '/api/products',
      headers: { host: 'maison.netlify.app' },
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      requestContext: { identity: { sourceIp: '127.0.0.1' } },
      body: null,
      isBase64Encoded: false,
    },
    {},
  );
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).products.length, 8);

  const rewritten = await handler(
    {
      httpMethod: 'GET',
      path: '/.netlify/functions/api/health',
      headers: { host: 'maison.netlify.app', 'x-nf-client-connection-ip': '127.0.0.1' },
      body: null,
      isBase64Encoded: false,
    },
    {},
  );
  assert.equal(rewritten.statusCode, 200);
  assert.equal(JSON.parse(rewritten.body).demo, true);
});
