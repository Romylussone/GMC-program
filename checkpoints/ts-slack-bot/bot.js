require("dotenv").config();

const { App } = require("@slack/bolt");

const { SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, PORT = 3000 } = process.env;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET) {
  throw new Error(
    "Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET in .env before starting the bot."
  );
}

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
});

// Responds when Slack sends the /hello slash-command request.
app.command("/hello", async ({ command, ack, respond, logger }) => {
  await ack();
  logger.info(`Received /hello from ${command.user_name} in ${command.channel_name}`);
  await respond(`Hello, <@${command.user_id}>! :wave:`);
});

// Logs every message event the app is subscribed to receive.
app.message(async ({ message, logger }) => {
  // Ignore message subtypes such as bot messages and message edits.
  if (message.subtype) return;

  logger.info({
    channel: message.channel,
    user: message.user,
    text: message.text,
    timestamp: message.ts,
  }, "Slack message received");
});

(async () => {
  await app.start(Number(PORT));
  app.logger.info(`Slack bot is listening on port ${PORT}`);
})();
