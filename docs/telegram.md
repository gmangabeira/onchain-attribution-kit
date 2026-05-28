# Telegram Alert Setup

## Step 1: Create a Telegram bot

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the prompts.
3. Choose a name and username for your bot.
4. BotFather will give you a token like: `7123456789:AAEzK9a...`
5. Copy this token — this is your `TELEGRAM_BOT_TOKEN`.

## Step 2: Get your chat ID

**For a personal chat:**
1. Search for `@userinfobot` in Telegram.
2. Send it any message.
3. It will reply with your user ID (e.g., `123456789`).
4. Use this as `TELEGRAM_CHAT_ID`.

**For a group chat:**
1. Add your bot to the group.
2. Send a message in the group.
3. Visit: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getUpdates`
4. Find the `chat.id` value. Group IDs are negative (e.g., `-100123456789`).

**For a channel:**
1. Add your bot as an admin of the channel.
2. Use `@channel_username` as the `TELEGRAM_CHAT_ID` (include the @).

## Step 3: Configure .env

```
TELEGRAM_BOT_TOKEN=7123456789:AAEzK9a...
TELEGRAM_CHAT_ID=123456789
ALERT_CHANNELS=telegram
```

## Step 4: Test

```bash
ts-node scripts/send-test-alert.ts --channel telegram
```

You should receive a test message in your Telegram chat.

## Troubleshooting

**Bot not receiving messages:**
- Make sure you sent at least one message to the bot first (bots cannot initiate conversations with users).
- For groups: confirm the bot is a member and has permission to send messages.

**401 Unauthorized:**
- Double-check your `TELEGRAM_BOT_TOKEN`.

**Bad Request: chat not found:**
- Double-check your `TELEGRAM_CHAT_ID`. For channels, use the @handle format.
