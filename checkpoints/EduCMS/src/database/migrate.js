const fs = require("node:fs/promises");
const path = require("node:path");
const db = require("../config/database");
async function migrate() {
  await db.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(214016)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
    );
    const directory = path.join(__dirname, "migrations");
    for (const name of (await fs.readdir(directory))
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      if (
        (
          await client.query(
            "SELECT name FROM schema_migrations WHERE name=$1",
            [name],
          )
        ).rowCount
      )
        continue;
      await client.query(await fs.readFile(path.join(directory, name), "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        name,
      ]);
      console.log(`Applied ${name}`);
    }
  });
}
if (require.main === module)
  migrate()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => db.pool.end());
module.exports = migrate;
