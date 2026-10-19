const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');

// Resolve the configuration relative to this file, regardless of the working directory.
require('dotenv').config({ path: path.join(__dirname, 'config', '.env'), quiet: true });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// Accept only editable schema fields; never pass MongoDB operators from a request.
function validateBody(req, res, next) {
  const body = req.body;
  const fields = ['name', 'email', 'age'];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Provide a JSON object.' });
  }
  if (!Object.keys(body).length || Object.keys(body).some((key) => !fields.includes(key))) {
    return res.status(400).json({ message: 'Provide name, email, or age only.' });
  }
  if (['name', 'email'].some((key) => key in body && typeof body[key] !== 'string')) {
    return res.status(400).json({ message: 'Name and email must be strings.' });
  }
  if ('age' in body && (typeof body.age !== 'number' || !Number.isInteger(body.age))) {
    return res.status(400).json({ message: 'Age must be a whole number.' });
  }
  next();
}

// Reject malformed IDs before attempting a database operation.
app.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }
  next();
});

// GET: retrieve every user with Mongoose's find method.
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
});

// POST: validate and persist a new user, returning the saved document and its ID.
app.post('/users', validateBody, async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

// PUT: update supplied fields and return the new document, with schema validation enabled.
app.put('/users/:id', validateBody, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.status(200).json(user);
});

// DELETE: remove a user by ID and return the deleted document as confirmation.
app.delete('/users/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.status(200).json(user);
});

// Keep unknown endpoints and expected errors readable in Postman.
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email already exists.' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body exceeds 10 KB.' });
  }
  console.error('Request failed:', err.message);
  res.status(500).json({ message: 'Internal server error.' });
});

// Start accepting requests only after MongoDB and the unique email index are ready.
async function start() {
  const port = Number(process.env.PORT || 5050);
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in config/.env.');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await User.init();
  const server = app.listen(port, () => {
    console.log(`MongoDB connected. API listening at http://localhost:${port}`);
  });
  server.on('error', async (err) => {
    console.error('Server failed:', err.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  });

  // Release the HTTP listener and MongoDB connection when the process is stopped.
  const shutdown = () => server.close(async () => {
    await mongoose.disconnect();
    process.exitCode = 0;
  });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (require.main === module) {
  start().catch(async (err) => {
    console.error('Startup failed:', err.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = app;
