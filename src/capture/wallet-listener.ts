/**
 * onchain-attribution-kit: wallet-listener.ts
 *
 * Server-side / Node.js wallet listener stub.
 *
 * In a browser context, use browser-snippet.ts directly.
 * In a server-side or SDK context (e.g., wagmi, ethers.js, viem),
 * adapt this module to listen for wallet connect events from your wallet library
 * and forward attribution data to the backend.
 *
 * This module exports:
 * - buildAttributionPayload: constructs a payload from wallet + stored context
 * - sendAttributionEvent: POSTs the payload to the event receiver
 *
 * For Next.js integration, see src/examples/nextjs/
 */

import { v4 as uuidv4 } from 'uuid';

export interface WalletConnectData {
  address: string;
  chainId: number;
}

export interface CampaignContext {
  session_id?: string;
  landing_url?: string;
  referrer?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  campaign_id?: string | null;
  ref?: string | null;
  kol?: string | null;
  source_wallet?: string | null;
}

export interface AttributionEvent {
  event_id: string;
  event_type: 'wallet_connected';
  wallet_address: string;
  chain_id: number;
  connected_at: string;
  session_id: string;
  landing_url: string;
  referrer: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_id: string | null;
  ref: string | null;
  kol: string | null;
  source_wallet: string | null;
  attribution_model: 'last_touch' | 'first_touch';
  metadata: Record<string, unknown>;
}

/**
 * Builds a complete attribution event payload.
 *
 * @param wallet - wallet address and chain
 * @param context - campaign context captured from browser (UTMs, referrer, etc.)
 * @param attributionModel - default: 'last_touch'
 * @param metadata - any extra fields to attach
 */
export function buildAttributionPayload(
  wallet: WalletConnectData,
  context: CampaignContext = {},
  attributionModel: 'last_touch' | 'first_touch' = 'last_touch',
  metadata: Record<string, unknown> = {}
): AttributionEvent {
  return {
    event_id: uuidv4(),
    event_type: 'wallet_connected',
    wallet_address: wallet.address.toLowerCase(),
    chain_id: wallet.chainId,
    connected_at: new Date().toISOString(),
    session_id: context.session_id ?? uuidv4(),
    landing_url: context.landing_url ?? '',
    referrer: context.referrer ?? '',
    utm_source: context.utm_source ?? null,
    utm_medium: context.utm_medium ?? null,
    utm_campaign: context.utm_campaign ?? null,
    utm_content: context.utm_content ?? null,
    utm_term: context.utm_term ?? null,
    campaign_id: context.campaign_id ?? null,
    ref: context.ref ?? null,
    kol: context.kol ?? null,
    source_wallet: context.source_wallet ?? null,
    attribution_model: attributionModel,
    metadata,
  };
}

/**
 * POSTs an attribution event to the local receiver.
 *
 * @param event - the attribution payload
 * @param endpoint - event receiver URL (default: http://localhost:3000/api/attribution/event)
 * @param writeKey - secret key for Authorization header
 */
export async function sendAttributionEvent(
  event: AttributionEvent,
  endpoint = 'http://localhost:3000/api/attribution/event',
  writeKey: string
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${writeKey}`,
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Attribution event rejected: ${response.status} ${body}`);
  }
}
