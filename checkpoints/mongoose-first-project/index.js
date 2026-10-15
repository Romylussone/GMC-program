const mongoose = require('mongoose');
const { connectDatabase } = require('./myApp');

// Check the connection without inserting, updating, or deleting any records.
async function main() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB successfully.');
  } catch (error) {
    // Do not log the connection string or credentials on connection failures.
    console.error(`MongoDB connection failed (${error.name}). Check your .env and Atlas access settings.`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
