import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDatabase, hasDatabase } from './db.js';
import { Product, User, Order, Subscriber } from './models.js';
import { products, variantKey } from '../shared/catalog.js';
import { orderSchema, priceOrder } from './commerce.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
  }),
);
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers.origin) {
    const configured = process.env.APP_ORIGIN;
    const origin = req.headers.origin;
    // Same-origin preview deployments remain usable without weakening cookie protection.
    const ownOrigin = `${req.secure ? 'https' : 'http'}://${req.get('host')}`;
    if (origin !== ownOrigin && origin !== configured)
      return res.status(403).json({ error: 'Origine non autorisée.' });
  }
  next();
});

const authLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});
function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
function requireAccounts() {
  if (!hasDatabase())
    fail(
      503,
      'Les comptes seront disponibles après connexion de la boutique à MongoDB. Vous pouvez commander en mode invité.',
    );
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    fail(503, 'Le service de connexion n’est pas encore configuré.');
}
function getUserId(req) {
  if (!req.cookies.maison_session || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(req.cookies.maison_session, process.env.JWT_SECRET, { algorithms: ['HS256'] })
      .sub;
  } catch {
    return null;
  }
}
function setSession(res, user) {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: '7d',
    algorithm: 'HS256',
  });
  res.cookie('maison_session', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 86400_000,
    path: '/',
  });
}
const publicUser = (user) => ({ id: String(user._id), name: user.name, email: user.email });
const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(10).max(128),
});

app.get('/api/health', async (req, res) => {
  await connectDatabase();
  res.json({
    status: 'ok',
    demo: !hasDatabase(),
    ordersEnabled: hasDatabase() && process.env.ENABLE_ORDERS === 'true',
  });
});
app.get('/api/products', async (req, res) => {
  if (!hasDatabase()) return res.json({ products, demo: true });
  await connectDatabase();
  const records = await Product.find().lean();
  if (!records.length)
    fail(503, 'Le catalogue doit être initialisé par le propriétaire de la boutique.');
  res.json({
    products: records.map(({ _id, __v, ...record }) => ({ ...record, id: _id })),
    demo: false,
  });
});
app.post('/api/auth/register', authLimit, async (req, res) => {
  requireAccounts();
  const data = credentials.extend({ name: z.string().trim().min(2).max(100) }).parse(req.body);
  await connectDatabase();
  const salt = randomBytes(16).toString('hex');
  const password = `${salt}:${scryptSync(data.password, salt, 64).toString('hex')}`;
  const user = await User.create({ name: data.name, email: data.email, password });
  setSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});
app.post('/api/auth/login', authLimit, async (req, res) => {
  requireAccounts();
  const data = credentials.parse(req.body);
  await connectDatabase();
  const user = await User.findOne({ email: data.email }).select('+password');
  const [salt, hash] = user?.password.split(':') || ['dummy-salt', '0'.repeat(128)];
  const candidate = scryptSync(data.password, salt, 64);
  if (!user || !timingSafeEqual(candidate, Buffer.from(hash, 'hex')))
    fail(401, 'Adresse e-mail ou mot de passe incorrect.');
  setSession(res, user);
  res.json({ user: publicUser(user) });
});
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('maison_session', {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ ok: true });
});
app.get('/api/auth/me', async (req, res) => {
  const id = getUserId(req);
  if (!id || !hasDatabase()) return res.json({ user: null });
  await connectDatabase();
  const user = await User.findById(id);
  res.json({ user: user ? publicUser(user) : null });
});
app.get('/api/orders', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) fail(401, 'Connectez-vous pour consulter vos commandes.');
  await connectDatabase();
  const orders = await Order.find({ userId })
    .select('reference items total status createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ orders });
});
app.post('/api/orders', async (req, res) => {
  const data = orderSchema.parse(req.body);
  if (!hasDatabase())
    return res
      .status(201)
      .json({
        ...priceOrder(data.items),
        reference: `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`,
        demo: true,
      });
  if (process.env.ENABLE_ORDERS !== 'true')
    fail(503, 'La prise de commandes n’est pas encore ouverte. Votre panier est conservé.');
  await connectDatabase();
  const userId = getUserId(req);
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ customer: data.customer, items: data.items, userId }))
    .digest('hex');
  let result;
  try {
    await mongoose.connection.transaction(async (session) => {
      const existing = await Order.findOne({ idempotencyKey: data.idempotencyKey }).session(
        session,
      );
      if (existing) {
        if (existing.requestHash !== requestHash)
          fail(409, 'Cette tentative de commande a déjà été utilisée. Actualisez la page.');
        result = existing;
        return;
      }
      const catalog = await Product.find({ _id: { $in: data.items.map((item) => item.productId) } })
        .session(session)
        .lean();
      const priced = priceOrder(data.items, catalog);
      for (const item of priced.items) {
        const updated = await Product.updateOne(
          {
            _id: item.productId,
            inventory: {
              $elemMatch: {
                key: variantKey(item.size, item.color),
                stock: { $gte: item.quantity },
              },
            },
          },
          { $inc: { 'inventory.$.stock': -item.quantity } },
          { session },
        );
        if (updated.modifiedCount !== 1)
          fail(409, `Stock insuffisant pour ${item.name} (${item.size}, ${item.color}).`);
      }
      [result] = await Order.create(
        [
          {
            ...priced,
            reference: `MSN-${randomBytes(6).toString('hex').toUpperCase()}`,
            idempotencyKey: data.idempotencyKey,
            requestHash,
            customer: data.customer,
            userId,
          },
        ],
        { session },
      );
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    result = await Order.findOne({ idempotencyKey: data.idempotencyKey, requestHash });
    if (!result) fail(409, 'Veuillez réessayer votre commande.');
  }
  res
    .status(201)
    .json({
      reference: result.reference,
      total: result.total,
      subtotal: result.subtotal,
      shipping: result.shipping,
      demo: false,
    });
});
app.post('/api/newsletter', authLimit, async (req, res) => {
  const data = z
    .object({
      email: z
        .email()
        .max(254)
        .transform((s) => s.toLowerCase()),
      consent: z.literal(true),
    })
    .parse(req.body);
  if (!hasDatabase()) return res.json({ demo: true });
  await connectDatabase();
  await Subscriber.updateOne(
    { email: data.email },
    { $setOnInsert: { email: data.email, consentAt: new Date() } },
    { upsert: true },
  );
  res.json({ demo: false });
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Cette ressource est introuvable.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof z.ZodError)
    return res
      .status(400)
      .json({
        error: 'Vérifiez les informations saisies.',
        fields: error.issues.map((issue) => issue.path.join('.')),
      });
  if (error.code === 11000)
    return res.status(409).json({ error: 'Ces informations sont déjà utilisées.' });
  if (error.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'Le format de la requête est invalide.' });
  if (error.type === 'entity.too.large')
    return res.status(413).json({ error: 'La requête est trop volumineuse.' });
  const status = error.status || 503;
  if (status >= 500) console.error('API error:', error.name, error.code || 'unavailable');
  res
    .status(status)
    .json({
      error: error.status
        ? error.message
        : 'Le service est momentanément indisponible. Veuillez réessayer.',
    });
});

export default app;
