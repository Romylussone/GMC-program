'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadConfig, registerHandlers } = require('../bot');

function setup() {
  const handlers = {};
  const logs = [];
  const replies = [];
  registerHandlers({
    event: (name, handler) => { handlers[name] = handler; },
    command: (name, handler) => { handlers[name] = handler; },
    error: (handler) => { handlers.error = handler; },
    logger: { error: (...args) => logs.push(args) },
  });
  return {
    handlers,
    logs,
    replies,
    message: (overrides = {}) => handlers.message({
      event: { user: 'U123', channel: 'C123', text: 'hello', ts: '123.456', ...overrides },
      body: { event_id: 'Ev123' },
      logger: { info: (...args) => logs.push(args) },
      say: async (reply) => replies.push(reply),
    }),
  };
}

test('logs a human message and greets the sender in a thread', async () => {
  const bot = setup();
  await bot.message({ text: ' Hi team!' });
  assert.deepEqual(bot.logs, [['message_received', {
    event_id: 'Ev123', channel: 'C123', user: 'U123', text: ' Hi team!', ts: '123.456',
  }]]);
  assert.deepEqual(bot.replies, [{
    text: 'Hello, <@U123>! :wave: Try /hello for a greeting.', thread_ts: '123.456',
  }]);
});

test('keeps a reply in an existing thread', async () => {
  const bot = setup();
  await bot.message({ text: 'HEY', thread_ts: '100.001' });
  assert.equal(bot.replies[0].thread_ts, '100.001');
});

test('logs ordinary text without replying or matching greeting substrings', async () => {
  const bot = setup();
  await bot.message({ text: 'This is a test' });
  await bot.message({ text: 'history' });
  assert.equal(bot.logs.length, 2);
  assert.equal(bot.replies.length, 0);
});

test('ignores bot messages, changed/deleted messages, and non-text events', async () => {
  const bot = setup();
  for (const event of [
    { bot_id: 'B123' },
    { subtype: 'bot_message' },
    { subtype: 'message_changed' },
    { subtype: 'message_deleted' },
    { subtype: 'channel_join' },
    { user: undefined },
    { text: undefined },
  ]) {
    await bot.message(event);
  }
  assert.deepEqual(bot.logs, []);
  assert.deepEqual(bot.replies, []);
});

test('/hello acknowledges before returning a private greeting', async () => {
  const bot = setup();
  const calls = [];
  await bot.handlers['/hello']({
    command: { user_id: 'U456' },
    ack: async () => calls.push('ack'),
    respond: async (response) => calls.push(response),
  });
  assert.deepEqual(calls, ['ack', {
    response_type: 'ephemeral',
    text: 'Hello, <@U456>! :wave: Your Slack bot is working.',
  }]);
});

test('error logging omits credential-bearing error details', async () => {
  const bot = setup();
  await bot.handlers.error({ code: 'slack_webapi_platform_error', message: 'private-token' });
  assert.deepEqual(bot.logs, [['Slack request failed', { code: 'slack_webapi_platform_error' }]]);
});

test('configuration defaults to port 3000 and accepts an explicit port', () => {
  const env = { SLACK_BOT_TOKEN: 'xoxb-test', SLACK_SIGNING_SECRET: 'test-secret' };
  assert.deepEqual(loadConfig(env), { token: 'xoxb-test', signingSecret: 'test-secret', port: 3000 });
  assert.equal(loadConfig({ ...env, PORT: '4000' }).port, 4000);
});

test('configuration rejects missing credentials and invalid ports', () => {
  assert.throws(() => loadConfig({}), /Set SLACK_BOT_TOKEN/);
  assert.throws(() => loadConfig({ SLACK_BOT_TOKEN: 'xoxb-test' }), /SLACK_SIGNING_SECRET/);
  assert.throws(() => loadConfig({ SLACK_BOT_TOKEN: 'xoxp-test', SLACK_SIGNING_SECRET: 'test' }), /SLACK_BOT_TOKEN/);
  for (const port of ['', '0', '-1', '65536', '3.14', '3000abc', '3e3']) {
    assert.throws(() => loadConfig({
      SLACK_BOT_TOKEN: 'xoxb-test', SLACK_SIGNING_SECRET: 'test', PORT: port,
    }), /PORT must/);
  }
});
