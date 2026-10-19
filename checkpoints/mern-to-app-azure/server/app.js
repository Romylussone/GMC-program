import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Todo } from './models/Todo.js';

const publicDirectory = fileURLToPath(new URL('../client/dist/', import.meta.url));

function validateTodo(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Send a JSON object.';
  }
  const keys = Object.keys(body);
  if (keys.some((key) => !['title', 'completed'].includes(key))) {
    return 'Only title and completed can be changed.';
  }
  if (partial && keys.length === 0) return 'Provide a title or completed status.';
  if (!partial || Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200) {
      return 'Title must contain between 1 and 200 characters.';
    }
  }
  if (Object.hasOwn(body, 'completed') && typeof body.completed !== 'boolean') {
    return 'Completed must be true or false.';
  }
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'unavailable',
      database: connected ? 'connected' : 'disconnected',
    });
  });

  // Fail quickly during a database outage instead of buffering writes.
  app.use('/api/todos', (_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res
        .status(503)
        .json({ message: 'The database is unavailable. Please try again shortly.' });
    }
    next();
  });

  app.get('/api/todos', async (_req, res) => {
    const todos = await Todo.find().sort({ createdAt: -1, _id: -1 }).lean();
    res.json(todos);
  });

  app.post('/api/todos', async (req, res) => {
    const message = validateTodo(req.body);
    if (message) return res.status(400).json({ message });
    const todo = await Todo.create(req.body);
    res.status(201).json(todo);
  });

  app.delete('/api/todos/completed', async (_req, res) => {
    const { deletedCount } = await Todo.deleteMany({ completed: true });
    res.json({ deletedCount });
  });

  app.use('/api/todos/:id', (req, res, next) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }
    next();
  });

  app.patch('/api/todos/:id', async (req, res) => {
    const message = validateTodo(req.body, true);
    if (message) return res.status(400).json({ message });
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!todo) return res.status(404).json({ message: 'Task not found.' });
    res.json(todo);
  });

  app.delete('/api/todos/:id', async (req, res) => {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Task not found.' });
    res.status(204).end();
  });

  app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

  // Vite builds here; Express serves both the API and React from one Azure app.
  if (existsSync(path.join(publicDirectory, 'index.html'))) {
    app.use(express.static(publicDirectory));
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(publicDirectory, 'index.html')));
  }

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Request body must be valid JSON.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ message: 'Request body is too large.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'The task contains invalid values.' });
    }
    // Avoid logging database URIs or sending internal error details to clients.
    console.error('Request failed:', err.name);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  });

  return app;
}
