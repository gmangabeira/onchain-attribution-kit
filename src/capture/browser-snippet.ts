/**
 * onchain-attribution-kit: browser-snippet.ts
 *
 * Client-side capture snippet. Reads UTM params and crypto-native campaign params
 * from the URL, persists them to localStorage, and sends an attribution payload
 * to the backend when a wallet connects.
 *
 * Privacy:
 * - No email, IP address, or device fingerprint is collected.
 * - Set window.ONCHAIN_ATTRIBUTION_DISABLED = true to opt out at any time.
 * - Teams are responsible for their own consent flows and local privacy laws.
 *
 * Usage:
 *   import { initAttribution, onWalletConnect } from './browser-snippet';
 *   initAttribution({ endpoint: '/api/attribution/event', writeKey: 'YOUR_WRITE_KEY' });
 *   onWalletConnect({ address: '0x...', chainId: 1 });
 */

import { v4 as uuidv4 } from 'uuid';

declare global {
  interface Window {
    ONCHAIN_ATTRIBUTION_DISABLED?: boolean;
  }
}

export interface AttributionConfig {
  /** Backend endpoint to POST attribution events to */
  endpoint: string;
  /** Write key sent in Authorization header */
  writeKey: string;
  /** Attribution window in days. Default: 7 */
  windowDays?: number;
  /** Attribution model. Default: 'last_touch' */
  attributionModel?: 'last_touch' | 'first_touch';
}

export interface CapturedCampaignContext {
  session_id: string;
  landing_url: string;
  referrer: string;
  captured_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_id: string | null;
  ref: string | null;
  invite: string | null;
  kol: string | null;
  source_wallet: string | null;
  chain_id: number | null;
}

export interface AttributionPayload extends CapturedCampaignContext {
  event_id: string;
  event_type: 'wallet_connected';
  wallet_address: string;
  connected_at: string;
  attribution_model: 'last_touch' | 'first_touch';
  metadata: Record<string, unknown>;
}

const STORAGE_KEY = 'onchain_attribution_context';

function getParam(params: URLSearchParams, key: string): string | null {
  return params.get(key) || null;
}

function parseChainId(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Reads campaign context from the current page URL and referrer.
 * Returns null if no attribution params are found and there is no stored context.
 */
export function captureCampaignContext(): CapturedCampaignContext {
  const params = new URLSearchParams(window.location.search);
  const now = new Date().toISOString();

  return {
    session_id: uuidv4(),
    landing_url: window.location.href,
    referrer: document.referrer || '',
    captured_at: now,
    utm_source: getParam(params, 'utm_source'),
    utm_medium: getParam(params, 'utm_medium'),
    utm_campaign: getParam(params, 'utm_campaign'),
    utm_content: getParam(params, 'utm_content'),
    utm_term: getParam(params, 'utm_term'),
    campaign_id: getParam(params, 'campaign_id'),
    ref: getParam(params, 'ref'),
    invite: getParam(params, 'invite'),
    kol: getParam(params, 'kol'),
    source_wallet: getParam(params, 'source_wallet'),
    chain_id: parseChainId(getParam(params, 'chain_id')),
  };
}

/**
 * Reads stored attribution context from localStorage.
 * Returns null if nothing is stored or the window has expired.
 */
export function getStoredContext(windowDays = 7): CapturedCampaignContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as CapturedCampaignContext;
    const capturedAt = new Date(stored.captured_at).getTime();
    const expiry = windowDays * 24 * 60 * 60 * 1000;

    if (Date.now() - capturedAt > expiry) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

/**
 * Persists attribution context to localStorage.
 */
export function storeContext(context: CapturedCampaignContext): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    console.warn('[onchain-attribution] localStorage unavailable. Context will not persist.');
  }
}

/**
 * Initializes attribution capture on page load.
 * If URL contains campaign params, stores them in localStorage (overwrites if last_touch).
 * If no params in URL, attempts to restore stored context.
 *
 * Call this once when the page loads.
 */
export function initAttribution(config: AttributionConfig): void {
  if (window.ONCHAIN_ATTRIBUTION_DISABLED) {
    console.info('[onchain-attribution] Disabled via window.ONCHAIN_ATTRIBUTION_DISABLED.');
    return;
  }

  const windowDays = config.windowDays ?? 7;
  const model = config.attributionModel ?? 'last_touch';
  const fresh = captureCampaignContext();
  const hasParams = fresh.utm_source || fresh.utm_campaign || fresh.ref || fresh.kol;

  if (hasParams) {
    // Last touch: overwrite stored context with the freshest campaign data
    if (model === 'last_touch') {
      storeContext(fresh);
    } else {
      // First touch: only store if nothing is stored yet
      const existing = getStoredContext(windowDays);
      if (!existing) storeContext(fresh);
    }
  }
}

/**
 * Sends an attribution event when a wallet connects.
 * Call this from your wallet connect handler.
 *
 * @param wallet - wallet address (checksummed EIP-55 or lowercase)
 * @param chainId - EVM chain ID (e.g. 1 for Ethereum mainnet)
 * @param config - must match the config used in initAttribution
 * @param metadata - optional additional fields
 */
export async function onWalletConnect(
  wallet: { address: string; chainId?: number },
  config: AttributionConfig,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (window.ONCHAIN_ATTRIBUTION_DISABLED) return;

  const windowDays = config.windowDays ?? 7;
  const model = config.attributionModel ?? 'last_touch';
  const stored = getStoredContext(windowDays) ?? captureCampaignContext();

  const payload: AttributionPayload = {
    ...stored,
    event_id: uuidv4(),
    event_type: 'wallet_connected',
    wallet_address: wallet.address.toLowerCase(),
    chain_id: wallet.chainId ?? stored.chain_id ?? null,
    connected_at: new Date().toISOString(),
    attribution_model: model,
    metadata,
  };

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.writeKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`[onchain-attribution] Event POST failed: ${response.status}`);
    }
  } catch (err) {
    console.warn('[onchain-attribution] Failed to send attribution event:', err);
  }
}
