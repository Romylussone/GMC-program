# Mongoose checkpoint

This project implements all the checkpoint exercises in `myApp.js`, with comments
explaining the schema, callbacks, queries, updates, and deletions.

## Setup

1. Run `npm install`.
2. Replace the placeholder in the private `.env` file with your MongoDB Atlas URI.
   If `.env` is absent, copy `.env.example` to `.env` first.
3. Keep the format `MONGO_URI="your-uri"`, with no spaces around `=`. Use an Atlas
   database user and allow your client IP in Atlas network access. Percent-encode
   special characters in the username and password.
4. Run `npm start` to verify the connection. This command connects and disconnects
   without changing database records.

`.env` is ignored by Git. Never commit your database credentials.

## Run an exercise

Connect first, then call any exported exercise with a Node-style `(err, data)`
callback. Disconnect once your work is finished. For example:

```js
const mongoose = require('mongoose');
const { connectDatabase, createManyPeople } = require('./myApp');

async function run() {
  await connectDatabase();
  createManyPeople([
    { name: 'Mary', age: 30, favoriteFoods: ['burritos'] },
    { name: 'Alex', age: 22, favoriteFoods: ['pasta', 'burritos'] },
  ], async (err, people) => {
    if (err) console.error(err.name);
    else console.log(people);
    await mongoose.disconnect();
  });
}

run().catch(() => {
  console.error('Connection failed. Check your MongoDB settings.');
  process.exitCode = 1;
});
```

| Export | Behavior |
| --- | --- |
| `createAndSavePerson(done)` | Save a sample John document |
| `createManyPeople(arrayOfPeople, done)` | Create the supplied people |
| `findPeopleByName(personName, done)` | Find all matching names |
| `findOneByFood(food, done)` | Find one person who likes the food |
| `findPersonById(personId, done)` | Find a person by ID |
| `findEditThenSave(personId, done)` | Add hamburger, then save |
| `findAndUpdate(personName, done)` | Set age to 20 and return the updated person |
| `removeById(personId, done)` | Delete and return one person |
| `removeManyPeople(done)` | Delete every Mary and return the operation result |
| `queryChain(done)` | Return up to two burrito fans sorted by name, without age |

Single-document lookups and updates return `null` when no person matches.
`removeManyPeople` changes every matching Mary in the connected database.

Mongoose is pinned to version 6 because the assignment requires callbacks,
`remove()`, and `findByIdAndRemove()`. Mongoose 7 removed callback support and
`remove()`; see the [official migration guide](https://mongoosejs.com/docs/migrating_to_7.html).

## Checks

Run `npm run check` and `npm test` for syntax and schema checks. To also exercise
all CRUD functions against MongoDB, set `TEST_MONGO_URI` to a local or dedicated
test server before running `npm test`. Tests use a separate, randomly named
database and drop only that database afterward. Without `TEST_MONGO_URI`, the
database integration test is explicitly skipped.

From PowerShell, you can also use the helper with a running test server:

```powershell
pwsh -NoProfile -File tools/Test-Integration.ps1 -MongoUri mongodb://127.0.0.1:27017
```
