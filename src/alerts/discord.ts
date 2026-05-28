/**
 * onchain-attribution-kit: discord.ts
 *
 * Sends attribution alerts to a Discord channel via an incoming webhook.
 *
 * Required env var:
 *   DISCORD_WEBHOOK_URL — from Server Settings > Integrations > Webhooks
 *
 * See docs/discord.md for setup instructions.
 */

import { AlertPayload, formatMarkdown } from './formatters';

interface DiscordConfig {
  webhookUrl: string;
  /** Optional override for the username shown in the message */
  username?: string;
  /** Optional override for the avatar URL shown in the message */
  avatarUrl?: string;
}

/**
 * Sends a Markdown-formatted alert to a Discord channel.
 *
 * @param payload - structured alert data
 * @param config - webhook URL; falls back to env var if omitted
 * @param dryRun - if true, formats and returns the message without sending
 */
export async function sendDiscordAlert(
  payload: AlertPayload,
  config?: Partial<DiscordConfig>,
  dryRun = false
): Promise<{ sent: boolean; message: string; error?: string }> {
  const webhookUrl = config?.webhookUrl ?? process.env['DISCORD_WEBHOOK_URL'] ?? '';

  if (!webhookUrl) {
    const msg = 'DISCORD_WEBHOOK_URL is not configured.';
    console.warn(`[discord] ${msg}`);
    return { sent: false, message: '', error: msg };
  }

  const message = formatMarkdown(payload);

  if (dryRun) {
    return { sent: false, message };
  }

  const body = JSON.stringify({
    content: message,
    username: config?.username ?? 'Attribution Kit',
    ...(config?.avatarUrl ? { avatar_url: config.avatarUrl } : {}),
  });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    // Discord returns 204 No Content on success
    if (response.status === 204 || response.ok) {
      return { sent: true, message };
    }

    const errorBody = await response.text();
    console.error(`[discord] Webhook error ${response.status}: ${errorBody}`);
    return { sent: false, message, error: `HTTP ${response.status}: ${errorBody}` };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[discord] Request failed: ${error}`);
    return { sent: false, message, error };
  }
}
