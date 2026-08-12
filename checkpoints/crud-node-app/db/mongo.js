const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI must be set when DATABASE_DRIVER=mongodb');
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectMongo };
