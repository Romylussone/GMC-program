'use strict';

const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { test } = require('node:test');
const { HTTPReceiver } = require('@slack/bolt');

test('Bolt HTTP endpoint verifies signed challenges and rejects forged or stale requests', async (t) => {
  const secret = 'local-test-signing-secret';
  const receiver = new HTTPReceiver({ signingSecret: secret, logLevel: 'error' });
  const server = await receiver.start({ port: 0, host: '127.0.0.1' });
  t.after(() => receiver.stop());
  const url = `http://127.0.0.1:${server.address().port}/slack/events`;
  const body = JSON.stringify({ type: 'url_verification', challenge: 'local-challenge' });

  async function send(timestamp, signingSecret = secret) {
    const signature = createHmac('sha256', signingSecret)
      .update(`v0:${timestamp}:${body}`).digest('hex');
    return fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-slack-request-timestamp': String(timestamp),
        'x-slack-signature': `v0=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const valid = await send(now);
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { challenge: 'local-challenge' });

  const forged = await send(now, 'incorrect-secret');
  assert.equal(forged.status, 401);
  await forged.text();

  const stale = await send(now - 600);
  assert.equal(stale.status, 401);
  await stale.text();
});
