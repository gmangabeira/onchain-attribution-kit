# Setup Guide

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A text editor
- (Optional) A Telegram, Discord, or Slack account for alerts

## Step 1: Clone or fork the repo

```bash
git clone https://github.com/gmangabeira/onchain-attribution-kit.git
cd onchain-attribution-kit
```

Or download the zip from GitHub and extract it.

## Step 2: Install dependencies

```bash
npm install
```

## Step 3: Configure environment variables

```bash
cp .env.example .env
```

Open `.env` in your editor. At minimum, set:

```
ONCHAIN_ATTRIBUTION_WRITE_KEY=your-secret-key-here
```

Generate a secure key with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

You can leave alert env vars empty for now. Configure them in the [Alerts setup](./alerts.md).

## Step 4: Start the server

```bash
npm run dev
```

You should see:
```
[onchain-attribution] Server running at http://localhost:3000
  POST /api/attribution/event — receive events
  GET  /api/health            — health check
  GET  /api/events.csv        — download events (dev only)
  GET  /                      — static HTML example
```

## Step 5: Test the health endpoint

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2026-05-28T12:00:00.000Z"}
```

## Step 6: Open the static HTML example

Open your browser to:
```
http://localhost:3000/?utm_source=x&utm_medium=social&utm_campaign=test-launch&utm_content=thread-01
```

You should see the attribution kit example page with your UTM params detected.

## Step 7: Simulate a wallet connect

On the example page, click "Connect Wallet". You should see:
- The event payload displayed on the page
- A new line added to `data/events.jsonl`

## Step 8: Check stored events

```bash
# View stored events
cat data/events.jsonl

# Download as CSV (dev only)
curl http://localhost:3000/api/events.csv -o my-events.csv
```

## Step 9: Run the test alert (optional)

```bash
npm run test:alert
# Sends a dry-run test to all configured channels
```

## Next steps

- [Campaign schema](./campaign-schema.md) — set up your UTM taxonomy
- [Dune setup](./dune-setup.md) — upload events and run queries
- [Alerts setup](./alerts.md) — configure Telegram, Discord, or Slack
