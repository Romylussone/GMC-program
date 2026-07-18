# Slack bot

## Setup

1. Create a Slack app and enable **Event Subscriptions**. Set the Request URL to your public `/slack/events` endpoint (use a tunnel such as ngrok while developing).
2. Under **OAuth & Permissions**, add the `chat:write` and `channels:history` bot-token scopes, then install the app to the workspace.
3. Subscribe to the `message.channels` bot event.
4. Create a `/hello` slash command and set its Request URL to your public `/slack/events` endpoint.
5. Put the app's signing secret in `SLACK_SIGNING_SECRET` in `.env`. The bot token is already present there.
6. Install dependencies and start the bot:

   ```bash
   npm install @slack/bolt dotenv
   npm start
   ```

The bot replies to `/hello` and logs ordinary message events to the terminal. Add the bot to any channel it should read.
