const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const { promisify } = require('node:util');
const mongoose = require('mongoose');
const app = require('../myApp');

// Schema validation works without a database connection.
test('a person requires a name', () => {
  const error = new app.Person({ age: 25 }).validateSync();
  assert.equal(error.errors.name.kind, 'required');
});

test('age is numeric and favorite foods are strings', () => {
  const person = new app.Person({
    name: 'Alex', age: '22', favoriteFoods: ['burritos', 42],
  });
  assert.equal(person.validateSync(), undefined);
  assert.equal(person.age, 22);
  assert.deepEqual([...person.favoriteFoods], ['burritos', '42']);
  const invalid = new app.Person({ name: 'Alex', age: 'not a number' });
  assert.equal(invalid.validateSync().errors.age.name, 'CastError');
});

test('favorite foods default to an empty array', () => {
  const person = new app.Person({ name: 'Alex' });
  assert.equal(person.validateSync(), undefined);
  assert.deepEqual([...person.favoriteFoods], []);
});

// Run the real database checks only when a dedicated test URI is supplied.
test('all checkpoint operations persist and return the expected results', {
  skip: process.env.TEST_MONGO_URI ? false : 'Set TEST_MONGO_URI to run database integration tests',
  timeout: 60000,
}, async (t) => {
  // A fresh random database isolates these destructive exercises from other data.
  const dbName = `mongoose_checkpoint_test_${randomUUID().replaceAll('-', '')}`;
  t.after(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        assert.equal(mongoose.connection.name, dbName);
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await mongoose.disconnect();
    }
  });
  await mongoose.connect(process.env.TEST_MONGO_URI, {
    dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
  });

  // Adapt callbacks in the test only; the submitted exercises use callbacks.
  const call = (name, ...args) => promisify(app[name])(...args);
  let john;
  let people;

  await t.test('construct and save a person', async () => {
    john = await call('createAndSavePerson');
    assert.equal(john.name, 'John');
    const stored = await app.Person.findById(john._id);
    assert.equal(stored.age, 25);
    assert.deepEqual([...stored.favoriteFoods], ['pizza', 'burritos']);
  });

  await t.test('create several people from the supplied array', async () => {
    people = await call('createManyPeople', [
      { name: 'Mary', age: 30, favoriteFoods: ['salad'] },
      { name: 'Mary', age: 40, favoriteFoods: ['soup'] },
      { name: 'Zoe', age: 28, favoriteFoods: ['burritos'] },
      { name: 'Alex', age: 22, favoriteFoods: ['burritos'] },
    ]);
    assert.equal(people.length, 4);
    assert.equal(await app.Person.countDocuments(), 5);
  });

  await t.test('find all matching names', async () => {
    const matches = await call('findPeopleByName', 'Mary');
    assert.equal(matches.length, 2);
    assert.ok(matches.every((person) => person.name === 'Mary'));
    assert.deepEqual(await call('findPeopleByName', 'Nobody'), []);
  });

  await t.test('find one matching favorite food', async () => {
    const person = await call('findOneByFood', 'soup');
    assert.equal(person.name, 'Mary');
    assert.equal(person.age, 40);
    assert.equal(await call('findOneByFood', 'unknown food'), null);
  });

  await t.test('find by ID and forward invalid ID errors', async () => {
    const person = await call('findPersonById', john._id);
    assert.equal(String(person._id), String(john._id));
    await assert.rejects(call('findPersonById', 'invalid-id'), { name: 'CastError' });
  });

  await t.test('push hamburger and persist the edited document', async () => {
    const person = await call('findEditThenSave', john._id);
    assert.deepEqual([...person.favoriteFoods], ['pizza', 'burritos', 'hamburger']);
    const stored = await app.Person.findById(john._id);
    assert.ok(stored.favoriteFoods.includes('hamburger'));
    assert.equal(await call('findEditThenSave', new mongoose.Types.ObjectId()), null);
    await assert.rejects(call('findEditThenSave', 'invalid-id'), { name: 'CastError' });
  });

  await t.test('update age and return the updated document', async () => {
    const person = await call('findAndUpdate', 'John');
    assert.equal(person.age, 20);
    assert.equal((await app.Person.findById(john._id)).age, 20);
    assert.equal(await call('findAndUpdate', 'Nobody'), null);
  });

  await t.test('chain filter, sort, limit, and projection', async () => {
    const matches = await call('queryChain');
    assert.deepEqual(matches.map((person) => person.name), ['Alex', 'John']);
    assert.ok(matches.every((person) => person.favoriteFoods.includes('burritos')));
    assert.ok(matches.every((person) => !Object.hasOwn(person.toObject(), 'age')));
  });

  await t.test('remove by ID and return the removed document', async () => {
    const person = await call('removeById', people[2]._id);
    assert.equal(person.name, 'Zoe');
    assert.equal(await app.Person.findById(person._id), null);
    assert.equal(await call('removeById', person._id), null);
  });

  await t.test('remove every Mary and return the deletion count', async () => {
    const result = await call('removeManyPeople');
    assert.equal(result.deletedCount, 2);
    assert.equal(await app.Person.countDocuments({ name: 'Mary' }), 0);
    assert.equal(await app.Person.countDocuments(), 2);
    assert.equal((await call('removeManyPeople')).deletedCount, 0);
  });

  await t.test('save validation errors reach the callback', async () => {
    await assert.rejects(call('createManyPeople', [{ age: 18 }]), { name: 'ValidationError' });
    assert.equal(await app.Person.countDocuments(), 2);
  });
});
