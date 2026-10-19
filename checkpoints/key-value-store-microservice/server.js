import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DistributedStore, StoreError } from './src/store.js';

const MAX_BODY_BYTES = 1024 * 1024;

export async function seedUsers(store) {
  const users = JSON.parse(await readFile(new URL('./data/users.json', import.meta.url), 'utf8'));
  for (const [key, value] of Object.entries(users)) store.set(key, value);
}

function readJson(request) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        if (!tooLarge) reject(new StoreError('JSON body exceeds 1 MiB', 413));
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) return;
      try { resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new StoreError('A valid JSON body is required')); }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new StoreError('Request aborted')));
  });
}

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

export function createApi(store = new DistributedStore()) {
  return createServer(async (request, response) => {
    try {
      let segments;
      try {
        segments = new URL(request.url, 'http://localhost').pathname.split('/').slice(1).map(decodeURIComponent);
      } catch { throw new StoreError('Invalid URL'); }
      const [root, resource, id, action] = segments;
      const method = request.method;

      if (method === 'GET' && segments.length === 1 && root === 'health') {
        // Coordinator liveness; individual node availability is exposed by /admin/stats.
        return send(response, 200, { status: 'ok' });
      }
      if (root === 'v1' && resource === 'kv' && segments.length === 3) {
        if (method === 'GET') return send(response, 200, store.get(id));
        if (method === 'PUT') return send(response, 200, store.set(id, await readJson(request)));
        if (method === 'DELETE') return send(response, 200, store.delete(id));
        return send(response, 405, { error: 'Use GET, PUT, or DELETE for keys' });
      }
      if (root === 'admin') {
        if (resource === 'stats' && segments.length === 2 && method === 'GET') {
          return send(response, 200, store.stats());
        }
        if (resource === 'keys' && segments.length === 3 && method === 'GET') {
          return send(response, 200, store.inspectKey(id));
        }
        if (resource === 'cache' && segments.length === 2 && method === 'DELETE') {
          store.clearCache();
          return send(response, 200, { cleared: true });
        }
        if (resource === 'nodes') {
          if (segments.length === 2 && method === 'POST') {
            const body = await readJson(request);
            return send(response, 201, store.joinNode(body?.id));
          }
          if (segments.length === 3 && method === 'DELETE') {
            return send(response, 200, store.leaveNode(id));
          }
          if (segments.length === 4 && method === 'POST') {
            if (action === 'fail') return send(response, 200, store.failNode(id));
            if (action === 'recover') return send(response, 200, store.recoverNode(id));
          }
        }
      }
      send(response, 404, { error: 'Route not found' });
    } catch (error) {
      if (!(error instanceof StoreError)) console.error(error);
      send(response, error instanceof StoreError ? error.status : 500, {
        error: error instanceof StoreError ? error.message : 'Internal server error',
      });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be between 0 and 65535');
  const store = new DistributedStore();
  await seedUsers(store);
  const server = createApi(store);
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Key-value API: http://127.0.0.1:${server.address().port}`);
    console.log('Loaded Alice, Bob, Charlie, Diana, Eve, and Frank. Run npm run demo for the guided simulation.');
  });
}
