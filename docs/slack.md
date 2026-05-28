# Slack Alert Setup

## Step 1: Create a Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps).
2. Click **Create New App > From scratch**.
3. Name it "Attribution Kit" and choose your workspace.

## Step 2: Enable incoming webhooks

1. In your app's sidebar, click **Incoming Webhooks**.
2. Toggle **Activate Incoming Webhooks** to On.
3. Scroll down and click **Add New Webhook to Workspace**.
4. Choose the channel you want alerts sent to.
5. Click **Allow**.
6. Copy the **Webhook URL**.

The URL looks like:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXX...
```

## Step 3: Configure .env

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXX...
ALERT_CHANNELS=slack
```

## Step 4: Test

```bash
ts-node scripts/send-test-alert.ts --channel slack
```

You should see a Block Kit-formatted message in your Slack channel.

## Troubleshooting

**403 Forbidden:**
- The webhook may have been revoked. Go to your Slack app settings and regenerate.

**No message appears:**
- Check that the webhook is pointing to the correct channel.
- Ensure the Slack app has been installed to your workspace.
