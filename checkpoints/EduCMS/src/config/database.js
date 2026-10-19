require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  max: Number(process.env.DB_POOL_MAX || 10),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT || 3000),
  idleTimeoutMillis: 30000,
  ...(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || "educms",
        user: process.env.DB_USER || "educms",
        password: process.env.DB_PASSWORD,
      }),
});
pool.on("error", (err) =>
  require("../utils/logger").error("Database pool error", {
    message: err.message,
  }),
);
const query = (text, params) => pool.query(text, params);
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { pool, query, transaction };
