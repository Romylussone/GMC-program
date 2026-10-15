const path = require('node:path');
const mongoose = require('mongoose');

// Load private connection settings from this project's .env file.
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Use basic schema types; [String] lets Mongoose track changes to the array.
const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  favoriteFoods: [String],
});

const Person = mongoose.model('Person', personSchema);

// Connect explicitly so importing the exercises never starts database work.
function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('YOUR_CLUSTER')) {
    throw new Error('Set MONGO_URI in your private .env file to your MongoDB URI.');
  }

  return mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Construct one document and save it using the Node-style (err, data) callback.
function createAndSavePerson(done) {
  const person = new Person({
    name: 'John',
    age: 25,
    favoriteFoods: ['pizza', 'burritos'],
  });

  person.save(function (err, data) {
    done(err, data);
  });
}

// Create and save every person supplied by the caller.
function createManyPeople(arrayOfPeople, done) {
  Person.create(arrayOfPeople, done);
}

// find() returns an array, including all people with this exact name.
function findPeopleByName(personName, done) {
  Person.find({ name: personName }, done);
}

// Matching an array field against a string finds documents containing that food.
function findOneByFood(food, done) {
  Person.findOne({ favoriteFoods: food }, done);
}

// MongoDB's unique _id identifies at most one person.
function findPersonById(personId, done) {
  Person.findById(personId, done);
}

// Read the document, change its typed array, then save inside the find callback.
function findEditThenSave(personId, done) {
  Person.findById(personId, function (err, person) {
    if (err) return done(err);
    if (!person) return done(null, null);

    person.favoriteFoods.push('hamburger');
    person.save(function (saveError, data) {
      done(saveError, data);
    });
  });
}

// new: true returns the person after setting the age, rather than before.
function findAndUpdate(personName, done) {
  Person.findOneAndUpdate(
    { name: personName },
    { $set: { age: 20 } },
    { new: true },
    done
  );
}

// Return the removed document through the callback.
function removeById(personId, done) {
  Person.findByIdAndRemove(personId, done);
}

// The checkpoint requires remove(); its result reports the deletion count.
function removeManyPeople(done) {
  Person.remove({ name: 'Mary' }, function (err, result) {
    done(err, result);
  });
}

// Filter, alphabetize, take two, and exclude age before executing the query.
function queryChain(done) {
  Person.find({ favoriteFoods: 'burritos' })
    .sort({ name: 1 })
    .limit(2)
    .select('-age')
    .exec(done);
}

// Export the model and exercises so a test runner or another script can use them.
module.exports = {
  Person,
  connectDatabase,
  createAndSavePerson,
  createManyPeople,
  findPeopleByName,
  findOneByFood,
  findPersonById,
  findEditThenSave,
  findAndUpdate,
  removeById,
  removeManyPeople,
  queryChain,
};
