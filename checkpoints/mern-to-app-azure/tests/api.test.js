import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import { createApp } from '../server/app.js';
import { Todo } from '../server/models/Todo.js';

let database;
const api = supertest(createApp());

before(
  async () => {
    database = await MongoMemoryServer.create();
    await mongoose.connect(database.getUri(), { dbName: 'daylist-tests' });
  },
  { timeout: 180000 },
);

beforeEach(async () => {
  await Todo.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await database?.stop();
});

test('health endpoint checks the MongoDB connection', async () => {
  const { body } = await api.get('/api/health').expect(200);
  assert.equal(body.database, 'connected');
});

test('tasks can be created, persisted, edited, completed, and deleted', async () => {
  const created = await api.post('/api/todos').send({ title: '  Deploy to Azure  ' }).expect(201);
  const id = created.body._id;
  assert.equal(created.body.title, 'Deploy to Azure');
  assert.equal(created.body.completed, false);
  assert.equal((await Todo.findById(id)).title, 'Deploy to Azure');

  const listed = await api.get('/api/todos').expect(200);
  assert.equal(listed.body.length, 1);
  assert.equal(listed.body[0]._id, id);

  const updated = await api
    .patch(`/api/todos/${id}`)
    .send({ title: 'Test deployment', completed: true })
    .expect(200);
  assert.equal(updated.body.title, 'Test deployment');
  assert.equal(updated.body.completed, true);
  assert.equal((await Todo.findById(id)).completed, true);

  await api.delete(`/api/todos/${id}`).expect(204);
  assert.equal(await Todo.findById(id), null);
});

test('clearing completed tasks preserves active tasks', async () => {
  await Todo.create([{ title: 'Keep me' }, { title: 'Done', completed: true }]);
  const { body } = await api.delete('/api/todos/completed').expect(200);
  assert.equal(body.deletedCount, 1);
  const remaining = await Todo.find();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].title, 'Keep me');
});

test('invalid create and update payloads are rejected without changing data', async () => {
  for (const body of [
    {},
    { title: '   ' },
    { title: 'a'.repeat(201) },
    { title: 1 },
    { title: 'Task', completed: 'false' },
    { title: 'Task', admin: true },
  ]) {
    await api.post('/api/todos').send(body).expect(400);
  }
  assert.equal(await Todo.countDocuments(), 0);
  const todo = await Todo.create({ title: 'Original' });
  for (const body of [{}, { title: '' }, { completed: 1 }, { $set: { title: 'Changed' } }]) {
    await api.patch(`/api/todos/${todo.id}`).send(body).expect(400);
  }
  assert.equal((await Todo.findById(todo.id)).title, 'Original');
});

test('malformed JSON, oversized payloads, invalid IDs, and missing tasks return JSON errors', async () => {
  await api.post('/api/todos').set('Content-Type', 'application/json').send('{broken').expect(400);
  await api
    .post('/api/todos')
    .send({ title: 'a'.repeat(11000) })
    .expect(413);
  await api.delete('/api/todos/invalid').expect(400);
  const missingId = new mongoose.Types.ObjectId().toString();
  await api.patch(`/api/todos/${missingId}`).send({ completed: true }).expect(404);
  await api.delete(`/api/todos/${missingId}`).expect(404);
  const unknown = await api.get('/api/missing').expect(404);
  assert.equal(unknown.body.message, 'API endpoint not found.');
});

test('database outages produce an unavailable health status and reject writes', async () => {
  await mongoose.disconnect();
  try {
    await api.get('/api/health').expect(503);
    await api.post('/api/todos').send({ title: 'Cannot save' }).expect(503);
  } finally {
    await mongoose.connect(database.getUri(), { dbName: 'daylist-tests' });
  }
});
