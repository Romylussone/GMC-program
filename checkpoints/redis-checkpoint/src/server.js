import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { openStore } from './stores.js';
import { Planner } from './planner.js';

export function createApi(planner, kind) {
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }); res.end(JSON.stringify({ error: 'Use GET' })); return; }
      const url = new URL(req.url, 'http://localhost');
      const params = Object.fromEntries(url.searchParams);
      for (const key of ['lon', 'lat', 'radius', 'window', 'limit']) {
        if (key in params) {
          if (!params[key].trim()) throw new Error(`Missing ${key}`);
          params[key] = Number(params[key]);
        }
      }
      let data;
      if (url.pathname === '/health') data = { ok: true, database: kind };
      else if (url.pathname === '/stops/nearby') data = await planner.nearby(params);
      else if (url.pathname === '/departures') data = await planner.departures(params);
      else if (url.pathname === '/plan') data = await planner.plan(params);
      else { res.writeHead(404); res.end(JSON.stringify({ error: 'Unknown endpoint' })); return; }
      res.end(JSON.stringify(data));
    } catch (error) {
      const databaseError = /Mongo|Redis|Socket|Connection|ServerSelection/.test(error.name)
        || /complete feed|Incomplete feed/.test(error.message);
      if (databaseError) console.error(error);
      res.writeHead(databaseError ? 503 : 400);
      res.end(JSON.stringify({ error: databaseError ? 'Database unavailable or feed incomplete' : error.message }));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const kind = process.env.DB || 'mongo';
  const store = await openStore(kind);
  try { await store.metadata(); }
  catch (error) { await store.close(); throw error; }
  const server = createApi(new Planner(store), kind);
  const port = Number(process.env.PORT || 3001);
  server.listen(port, '127.0.0.1', () => console.log(`Trip planner (${kind}): http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(async () => { await store.close(); process.exit(0); });
    server.closeIdleConnections();
  });
}
