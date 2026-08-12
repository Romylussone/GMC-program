require('dotenv').config();

const express = require('express');
const { connectMongo } = require('./db/mongo');
const { initializeProductTable } = require('./db/mysql');

const app = express();
const driver = (process.env.DATABASE_DRIVER || 'mongodb').toLowerCase();

app.use(express.json());

if (driver === 'mongodb') {
  app.use(require('./routes/noSQLRoutes'));
} else if (driver === 'mysql') {
  app.use(require('./routes/sqlRoutes'));
} else {
  throw new Error('DATABASE_DRIVER must be either "mongodb" or "mysql"');
}

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && Object.hasOwn(error, 'body')) {
    return response.status(400).json({ message: 'Invalid JSON request body' });
  }
  return response.status(500).json({ message: 'Unexpected server error' });
});

async function start() {
  if (driver === 'mongodb') await connectMongo();
  if (driver === 'mysql') await initializeProductTable();

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Product API (${driver}) listening on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });
}

module.exports = { app, start };
