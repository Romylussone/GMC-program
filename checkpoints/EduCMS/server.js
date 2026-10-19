const app = require("./src/app");
const db = require("./src/config/database");
const cache = require("./src/services/cacheService");
const config = require("./src/config/env");
const logger = require("./src/utils/logger");
async function start() {
  await db.query("SELECT 1");
  await cache.connect();
  const server = app.listen(config.port, () =>
    logger.info(`EduCMS listening on http://localhost:${config.port}`),
  );
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      await cache.close();
      await db.pool.end();
      clearTimeout(timeout);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  return server;
}
if (require.main === module)
  start().catch((error) => {
    logger.error(error.message);
    process.exitCode = 1;
    db.pool.end();
  });
module.exports = { app, start };
