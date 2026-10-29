# Slack Bot API

A Node.js bot built with Slack Bolt. It replies to messages starting with `hello`, `hi`, or `hey` in a thread, handles the `/hello` slash command with a private greeting, and logs new human text messages received through the Events API.

## Install and configure

Use Node.js 20 or newer and npm. In this directory:

```powershell
npm ci
Copy-Item .env.example .env
```

1. At [Your Slack Apps](https://api.slack.com/apps), choose **Create New App > From a manifest**, select your workspace, and paste `slack-app-manifest.json`. The `example.com` URLs are placeholders that you will replace after starting the bot and tunnel below.
2. Check **OAuth & Permissions > Bot Token Scopes**: `chat:write` sends messages, `channels:history` receives public-channel messages, and `commands` enables `/hello`. These are included in the manifest.
3. Choose **Install to Workspace** and authorize the app. Copy the **Bot User OAuth Token** (`xoxb-...`) into `SLACK_BOT_TOKEN` in `.env`.
4. Under **Basic Information > App Credentials**, copy the **Signing Secret** into `SLACK_SIGNING_SECRET`. This is a separate credential from the OAuth token.

Keep `.env` local; it is excluded from Git. Do not paste credentials into code or commit them.

## Start and connect Slack

```powershell
npm start
```

The bot listens on port `3000` by default. Set `PORT` in `.env` to change it. For automatic restarts during development, use `npm run dev`.

Slack must reach the bot over public HTTPS. For local development, install [ngrok](https://ngrok.com/docs/getting-started/) and configure its account, then run in another terminal:

```powershell
ngrok http 3000
```

Use the port from `.env` if you changed it. Copy the tunnel's HTTPS forwarding address and append `/slack/events`, for example `https://your-tunnel.ngrok-free.app/slack/events`.

1. In the Slack app's **Event Subscriptions**, enable events and replace the placeholder Request URL with your HTTPS endpoint. Keep the bot running during verification; Bolt responds to Slack's challenge and verifies signed requests automatically.
2. Under **Subscribe to bot events**, confirm `message.channels`, then **Save Changes**.
3. Under **Slash Commands**, edit `/hello` and set its **Request URL** to the same HTTPS endpoint. Save it. A slash command is configured separately from message events.
4. Reinstall the app if Slack prompts after permission changes.
5. Invite **GMC Hello Bot** to a public test channel using Slack's **Add apps** menu or `/invite`.

The manifest also lets you configure these settings manually if you created the app **From scratch**. Whenever the tunnel URL changes, update both Request URLs. Stop the bot with Ctrl+C.

## Try it

| Action in the public test channel | Expected result |
| --- | --- |
| Send `hello` or `Hi team!` | A greeting appears in a thread under your message. |
| Send `hey` inside an existing thread | The bot replies in that same thread. |
| Run `/hello` | Slack displays a greeting visible only to you. |
| Send `Testing the Events API` | The terminal logs `message_received` with the event ID, channel, user, text, and timestamp. |
| Edit a message or let another bot post | No reply or message log from this handler. |

This configuration covers public channels the bot has joined. Private channels and direct messages require additional event subscriptions and permissions. Message logs include conversation text; use a test channel and handle those logs appropriately.

## Verify locally

```powershell
npm run check
npm test
```

Tests use synthetic payloads and no real Slack credentials. They check greeting replies, thread handling, message logging, bot-loop prevention, command acknowledgement, and configuration validation. A local HTTP test also checks Bolt's signed URL verification challenge and rejection of forged or expired signatures. Live Slack delivery requires your installed app, credentials, and reachable HTTPS endpoint.

If startup fails, check `.env`, the OAuth token, and whether the port is already in use. If nothing arrives, confirm the bot joined the channel, `message.channels` is saved, both Request URLs match the current tunnel, and the tunnel and bot processes are running. Missing `/hello` usually means the command was not saved or the `commands` scope needs reinstalling. Unsigned requests from a browser or Postman are rejected; Slack signs the requests it sends.

## References

- [Bolt: listening to messages](https://docs.slack.dev/tools/bolt-js/concepts/message-listening/)
- [Bolt: listening and responding to commands](https://docs.slack.dev/tools/bolt-js/concepts/commands/)
- [Events API: message.channels](https://docs.slack.dev/reference/events/message.channels/)
- [Slack app manifest reference](https://docs.slack.dev/reference/app-manifest/)
