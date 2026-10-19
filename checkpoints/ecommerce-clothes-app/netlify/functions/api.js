import serverless from 'serverless-http';
import { isIP } from 'node:net';
import app from '../../server/app.js';

const handle = serverless(app);

export const handler = (event, context) => {
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const candidate =
    event.requestContext?.identity?.sourceIp || headers['x-nf-client-connection-ip'];
  // Netlify's Lambda events may omit AWS's requestContext identity. Express's
  // proxy and rate-limit middleware still need a valid socket address.
  const sourceIp = candidate && isIP(candidate) ? candidate : '127.0.0.1';
  return handle(
    {
      ...event,
      path: event.path.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '/api'),
      requestContext: {
        ...event.requestContext,
        identity: { ...event.requestContext?.identity, sourceIp },
      },
    },
    context,
  );
};
