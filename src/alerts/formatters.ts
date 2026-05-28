/**
 * onchain-attribution-kit: formatters.ts
 *
 * Shared alert formatters. Produce compact, crypto-native alert text
 * from a structured alert payload. Used by telegram.ts, discord.ts, slack.ts.
 */

export interface AlertPayload {
  /** Campaign ID or name */
  campaign: string;
  /** UTM source */
  source: string;
  /** UTM medium */
  medium: string;
  /** Total wallets captured in window */
  wallets_captured: number;
  /** Wallets that performed a tracked on-chain action */
  converted_wallets: number;
  /** Most common first on-chain action label */
  top_action?: string;
  /** Time window description, e.g. "last 24h" */
  window: string;
  /** Optional: alert type / title override */
  title?: string;
  /** Optional: extra lines to append */
  notes?: string[];
}

/**
 * Formats an alert payload as plain text.
 * This is the canonical format used by Telegram.
 */
export function formatPlainText(payload: AlertPayload): string {
  const conversionRate =
    payload.wallets_captured > 0
      ? ((payload.converted_wallets / payload.wallets_captured) * 100).toFixed(1)
      : '0.0';

  const title = payload.title ?? 'Onchain attribution alert';
  const lines = [
    title,
    '',
    `Campaign: ${payload.campaign}`,
    `Source: ${payload.source} / ${payload.medium}`,
    `Wallets captured: ${payload.wallets_captured}`,
    `Converted wallets: ${payload.converted_wallets}`,
    `Conversion rate: ${conversionRate}%`,
    ...(payload.top_action ? [`Top action: ${payload.top_action}`] : []),
    `Window: ${payload.window}`,
    ...(payload.notes && payload.notes.length > 0 ? ['', ...payload.notes] : []),
  ];

  return lines.join('\n');
}

/**
 * Formats an alert payload as a Markdown string.
 * Used by Discord (which renders Markdown in webhooks).
 */
export function formatMarkdown(payload: AlertPayload): string {
  const conversionRate =
    payload.wallets_captured > 0
      ? ((payload.converted_wallets / payload.wallets_captured) * 100).toFixed(1)
      : '0.0';

  const title = payload.title ?? 'Onchain attribution alert';
  const lines = [
    `**${title}**`,
    '',
    `**Campaign:** ${payload.campaign}`,
    `**Source:** ${payload.source} / ${payload.medium}`,
    `**Wallets captured:** ${payload.wallets_captured}`,
    `**Converted wallets:** ${payload.converted_wallets}`,
    `**Conversion rate:** ${conversionRate}%`,
    ...(payload.top_action ? [`**Top action:** ${payload.top_action}`] : []),
    `**Window:** ${payload.window}`,
    ...(payload.notes && payload.notes.length > 0 ? ['', ...payload.notes] : []),
  ];

  return lines.join('\n');
}

/**
 * Formats an alert payload as Slack Block Kit JSON.
 * Returns an object ready to be JSON.stringified and sent as the webhook body.
 */
export function formatSlackBlocks(payload: AlertPayload): object {
  const conversionRate =
    payload.wallets_captured > 0
      ? ((payload.converted_wallets / payload.wallets_captured) * 100).toFixed(1)
      : '0.0';

  const title = payload.title ?? 'Onchain attribution alert';
  const fields = [
    `*Campaign:* ${payload.campaign}`,
    `*Source:* ${payload.source} / ${payload.medium}`,
    `*Wallets captured:* ${payload.wallets_captured}`,
    `*Converted wallets:* ${payload.converted_wallets}`,
    `*Conversion rate:* ${conversionRate}%`,
    ...(payload.top_action ? [`*Top action:* ${payload.top_action}`] : []),
    `*Window:* ${payload.window}`,
  ];

  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: false },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: fields.join('\n'),
      },
    },
  ];

  if (payload.notes && payload.notes.length > 0) {
    blocks.push({
      type: 'context',
      elements: payload.notes.map((note) => ({
        type: 'mrkdwn',
        text: note,
      })),
    });
  }

  return { blocks };
}
