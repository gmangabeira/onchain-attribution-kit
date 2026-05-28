/**
 * onchain-attribution-kit: send-test-alert.ts
 *
 * Sends a test alert to Telegram, Discord, Slack, or all channels.
 *
 * Usage:
 *   ts-node scripts/send-test-alert.ts --channel all
 *   ts-node scripts/send-test-alert.ts --channel telegram
 *   ts-node scripts/send-test-alert.ts --channel discord --dry-run
 *   npm run test:alert
 */

// Load .env if present
const envPath = `${process.cwd()}/.env`;
try {
  const fs = require('fs') as typeof import('fs');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
} catch {
  // .env not required
}

import { sendTelegramAlert } from '../src/alerts/telegram';
import { sendDiscordAlert } from '../src/alerts/discord';
import { sendSlackAlert } from '../src/alerts/slack';
import { AlertPayload, formatPlainText, formatMarkdown, formatSlackBlocks } from '../src/alerts/formatters';

const TEST_PAYLOAD: AlertPayload = {
  campaign: 'test-campaign-2026',
  source: 'x',
  medium: 'social',
  wallets_captured: 42,
  converted_wallets: 9,
  top_action: 'first_swap',
  window: 'last 24h',
  title: 'Onchain attribution alert [TEST]',
  notes: ['This is a test message from onchain-attribution-kit.'],
};

function parseArgs(): { channel: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  let channel = 'all';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--channel' && args[i + 1]) {
      channel = args[i + 1];
      i++;
    }
    if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { channel, dryRun };
}

async function run(): Promise<void> {
  const { channel, dryRun } = parseArgs();

  if (dryRun) {
    console.log('[send-test-alert] Dry run mode. No messages will be sent.\n');
  }

  const channels = channel === 'all' ? ['telegram', 'discord', 'slack'] : [channel];

  for (const ch of channels) {
    console.log(`--- ${ch.toUpperCase()} ---`);

    // In dry-run mode, format directly without requiring env vars to be set
    if (dryRun) {
      let formatted: string;
      if (ch === 'telegram') {
        formatted = formatPlainText(TEST_PAYLOAD);
      } else if (ch === 'discord') {
        formatted = formatMarkdown(TEST_PAYLOAD);
      } else if (ch === 'slack') {
        formatted = JSON.stringify(formatSlackBlocks(TEST_PAYLOAD), null, 2);
      } else {
        console.error(`Unknown channel: ${ch}. Use telegram, discord, slack, or all.`);
        process.exit(1);
      }
      console.log('Formatted message:');
      console.log(formatted);
      console.log('');
      continue;
    }

    let result: { sent: boolean; message: string; error?: string };

    if (ch === 'telegram') {
      result = await sendTelegramAlert(TEST_PAYLOAD, {}, false);
    } else if (ch === 'discord') {
      result = await sendDiscordAlert(TEST_PAYLOAD, {}, false);
    } else if (ch === 'slack') {
      result = await sendSlackAlert(TEST_PAYLOAD, {}, false);
    } else {
      console.error(`Unknown channel: ${ch}. Use telegram, discord, slack, or all.`);
      process.exit(1);
    }

    if (result.sent) {
      console.log(`Sent successfully.`);
    } else {
      console.error(`Failed: ${result.error ?? 'unknown error'}`);
    }
    console.log('');
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
