# Discord Alert Setup

## Step 1: Create a webhook

1. Open your Discord server.
2. Go to **Server Settings > Integrations > Webhooks**.
3. Click **New Webhook**.
4. Choose the channel you want alerts sent to.
5. (Optional) Set a name like "Attribution Kit".
6. Click **Copy Webhook URL**.

The URL looks like:
```
https://discord.com/api/webhooks/123456789/abcdef...
```

## Step 2: Configure .env

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdef...
ALERT_CHANNELS=discord
```

## Step 3: Test

```bash
ts-node scripts/send-test-alert.ts --channel discord
```

You should see a formatted message in your Discord channel.

## Troubleshooting

**404 Not Found:**
- The webhook URL may have been deleted. Create a new one.

**400 Bad Request:**
- Check that the webhook URL is complete and not truncated.

**No message in channel:**
- Make sure the webhook is linked to the correct channel.
