/**
 * onchain-attribution-kit: telegram.ts
 *
 * Sends attribution alerts to a Telegram chat via the Bot API.
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN — from @BotFather
 *   TELEGRAM_CHAT_ID   — chat or channel ID
 *
 * See docs/telegram.md for setup instructions.
 */

import { AlertPayload, formatPlainText } from './formatters';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  /** Optional: Telegram parse_mode. Default: undefined (plain text) */
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

/**
 * Sends a plain-text alert message to Telegram.
 *
 * @param payload - structured alert data
 * @param config - bot token and chat ID; falls back to env vars if omitted
 * @param dryRun - if true, formats and returns the message without sending
 */
export async function sendTelegramAlert(
  payload: AlertPayload,
  config?: Partial<TelegramConfig>,
  dryRun = false
): Promise<{ sent: boolean; message: string; error?: string }> {
  const botToken = config?.botToken ?? process.env['TELEGRAM_BOT_TOKEN'] ?? '';
  const chatId = config?.chatId ?? process.env['TELEGRAM_CHAT_ID'] ?? '';

  if (!botToken || !chatId) {
    const msg = 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.';
    console.warn(`[telegram] ${msg}`);
    return { sent: false, message: '', error: msg };
  }

  const message = formatPlainText(payload);

  if (dryRun) {
    return { sent: false, message };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = JSON.stringify({
    chat_id: chatId,
    text: message,
    ...(config?.parseMode ? { parse_mode: config.parseMode } : {}),
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const result = (await response.json()) as TelegramResponse;

    if (!result.ok) {
      console.error(`[telegram] API error: ${result.description ?? 'unknown'}`);
      return { sent: false, message, error: result.description };
    }

    return { sent: true, message };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[telegram] Request failed: ${error}`);
    return { sent: false, message, error };
  }
}
