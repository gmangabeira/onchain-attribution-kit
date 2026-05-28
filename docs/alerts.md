# Alerts Setup

The kit supports sending attribution alerts to Telegram, Discord, and Slack.

## Quick start

1. Configure the channels you want in `.env`:

```
ALERT_CHANNELS=telegram,discord,slack
```

2. Set the env vars for each channel (see channel-specific docs below).

3. Send a test alert:

```bash
npm run test:alert
# or with a specific channel:
ts-node scripts/send-test-alert.ts --channel telegram --dry-run
```

## Channel setup guides

- [Telegram](./telegram.md) — best for crypto-native teams; bot setup takes 2 minutes
- [Discord](./discord.md) — best for community channels; uses webhook integration
- [Slack](./slack.md) — best for internal team ops; uses incoming webhook

## Alert use cases

You can trigger alerts from your application when:

- A new wallet connects from a target campaign
- A campaign crosses a wallet count threshold
- A daily attribution summary is ready
- A Dune query export shows anomalous activity

Example: send a daily summary alert from a cron job:

```typescript
import { sendTelegramAlert } from './src/alerts/telegram';
import { AlertPayload } from './src/alerts/formatters';

const payload: AlertPayload = {
  campaign: 'launch-q2-2026',
  source: 'x',
  medium: 'social',
  wallets_captured: 147,
  converted_wallets: 22,
  top_action: 'first_swap',
  window: 'last 24h',
};

await sendTelegramAlert(payload);
```

## Alert format

All alerts use the same compact format:

```
Onchain attribution alert

Campaign: launch-q2-2026
Source: x / social
Wallets captured: 147
Converted wallets: 22
Conversion rate: 15.0%
Top action: first_swap
Window: last 24h
```

Telegram receives plain text. Discord receives Markdown formatting. Slack receives Block Kit.

## Test without sending

Use `--dry-run` to preview the alert message without sending:

```bash
ts-node scripts/send-test-alert.ts --channel all --dry-run
```
