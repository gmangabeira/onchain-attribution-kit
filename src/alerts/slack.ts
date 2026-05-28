/**
 * onchain-attribution-kit: slack.ts
 *
 * Sends attribution alerts to a Slack channel via an incoming webhook.
 * Uses Slack Block Kit for structured formatting.
 *
 * Required env var:
 *   SLACK_WEBHOOK_URL — from https://api.slack.com/apps (Incoming Webhooks)
 *
 * See docs/slack.md for setup instructions.
 */

import { AlertPayload, formatSlackBlocks } from './formatters';

interface SlackConfig {
  webhookUrl: string;
}

/**
 * Sends a Block Kit-formatted alert to a Slack channel.
 *
 * @param payload - structured alert data
 * @param config - webhook URL; falls back to env var if omitted
 * @param dryRun - if true, formats and returns the message without sending
 */
export async function sendSlackAlert(
  payload: AlertPayload,
  config?: Partial<SlackConfig>,
  dryRun = false
): Promise<{ sent: boolean; message: string; error?: string }> {
  const webhookUrl = config?.webhookUrl ?? process.env['SLACK_WEBHOOK_URL'] ?? '';

  if (!webhookUrl) {
    const msg = 'SLACK_WEBHOOK_URL is not configured.';
    console.warn(`[slack] ${msg}`);
    return { sent: false, message: '', error: msg };
  }

  const blocks = formatSlackBlocks(payload);
  const message = JSON.stringify(blocks);

  if (dryRun) {
    return { sent: false, message };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: message,
    });

    // Slack returns "ok" plain text on success
    const body = await response.text();

    if (body === 'ok') {
      return { sent: true, message };
    }

    console.error(`[slack] Webhook error ${response.status}: ${body}`);
    return { sent: false, message, error: `HTTP ${response.status}: ${body}` };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[slack] Request failed: ${error}`);
    return { sent: false, message, error };
  }
}
