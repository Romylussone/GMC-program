'use strict';

const { App } = require('@slack/bolt');

function loadConfig(env = process.env) {
  const token = env.SLACK_BOT_TOKEN?.trim();
  const signingSecret = env.SLACK_SIGNING_SECRET?.trim();

  if (!token?.startsWith('xoxb-') || !signingSecret) {
    throw new Error(
      'Set SLACK_BOT_TOKEN (xoxb-...) and SLACK_SIGNING_SECRET in .env. See README.md.',
    );
  }

  const portText = env.PORT ?? '3000';
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return { token, signingSecret, port };
}

function registerHandlers(app) {
  app.event('message', async ({ event, body, say, logger }) => {
    // Ignore bot messages, edits, deletions, and channel notifications.
    // In particular, never reply to the bot's own replies.
    if (event.bot_id || event.subtype || !event.user || typeof event.text !== 'string') {
      return;
    }

    logger.info('message_received', {
      event_id: body.event_id,
      channel: event.channel,
      user: event.user,
      text: event.text,
      ts: event.ts,
    });

    if (/^\s*(hello|hi|hey)\b/i.test(event.text)) {
      await say({
        text: `Hello, <@${event.user}>! :wave: Try /hello for a greeting.`,
        thread_ts: event.thread_ts || event.ts,
      });
    }
  });

  app.command('/hello', async ({ command, ack, respond }) => {
    // Acknowledge first to meet Slack's three-second deadline.
    await ack();
    await respond({
      response_type: 'ephemeral',
      text: `Hello, <@${command.user_id}>! :wave: Your Slack bot is working.`,
    });
  });

  app.error(async (error) => {
    // Avoid dumping request bodies, tokens, or response URLs on errors.
    app.logger.error('Slack request failed', { code: error.code || 'unknown_error' });
  });
}

function createApp({ token, signingSecret }) {
  // Bolt verifies Slack request signatures and handles URL verification.
  const app = new App({ token, signingSecret });
  registerHandlers(app);
  return app;
}

async function start() {
  require('dotenv').config({ quiet: true });
  const config = loadConfig();
  const app = createApp(config);
  await app.start(config.port);
  console.log(`Slack bot listening on port ${config.port}; endpoint: /slack/events`);

  const shutdown = async () => {
    try {
      await app.stop();
    } catch {
      console.error('Could not stop the Slack bot cleanly.');
      process.exitCode = 1;
    }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return app;
}

if (require.main === module) {
  start().catch((error) => {
    const configurationError = error.message?.startsWith('Set SLACK_')
      || error.message?.startsWith('PORT must');
    console.error(configurationError ? error.message : `Bot startup failed (${error.code || 'unknown_error'}). Check your Slack credentials and port.`);
    process.exitCode = 1;
  });
}

module.exports = { createApp, loadConfig, registerHandlers, start };
