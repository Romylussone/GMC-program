const { createClient } = require("redis");
const logger = require("../utils/logger");
let client;
async function connect() {
  if (process.env.REDIS_ENABLED !== "true") return;
  client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: { connectTimeout: 2000, reconnectStrategy: false },
  });
  client.on("error", (error) =>
    logger.warn("Redis unavailable", { message: error.message }),
  );
  try {
    await client.connect();
  } catch {
    client = undefined;
  }
}
module.exports = {
  connect,
  async get(key) {
    try {
      return client?.isReady
        ? JSON.parse(await client.get(`educms:${key}`))
        : null;
    } catch {
      return null;
    }
  },
  async set(key, data, seconds = 60) {
    try {
      if (client?.isReady)
        await client.setEx(`educms:${key}`, seconds, JSON.stringify(data));
    } catch {
      /* Cache is optional. */
    }
  },
  async close() {
    if (client?.isReady) await client.quit();
  },
};
