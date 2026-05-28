/**
 * onchain-attribution-kit: validation.ts
 *
 * Request validation for attribution event payloads.
 * Returns a typed result so callers can surface errors without exceptions.
 */

import { AttributionEvent } from '../capture/wallet-listener';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ALLOWED_EVENT_TYPES = ['wallet_connected'] as const;
const ALLOWED_ATTRIBUTION_MODELS = ['last_touch', 'first_touch'] as const;

function isEthAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function isISO8601(value: string): boolean {
  return !isNaN(Date.parse(value));
}

/**
 * Validates an incoming attribution event payload.
 * Does not mutate the input.
 */
export function validateEvent(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }

  const event = body as Partial<AttributionEvent>;

  // Required fields
  if (!event.event_id || typeof event.event_id !== 'string') {
    errors.push('event_id is required and must be a string.');
  }
  if (!event.event_type || !ALLOWED_EVENT_TYPES.includes(event.event_type as typeof ALLOWED_EVENT_TYPES[number])) {
    errors.push(`event_type must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}.`);
  }
  if (!event.wallet_address || typeof event.wallet_address !== 'string') {
    errors.push('wallet_address is required and must be a string.');
  } else if (!isEthAddress(event.wallet_address)) {
    errors.push('wallet_address must be a valid Ethereum address (0x + 40 hex chars).');
  }
  if (event.chain_id !== undefined && event.chain_id !== null) {
    if (typeof event.chain_id !== 'number' || !Number.isInteger(event.chain_id) || event.chain_id <= 0) {
      errors.push('chain_id must be a positive integer when provided.');
    }
  }
  if (!event.connected_at || typeof event.connected_at !== 'string' || !isISO8601(event.connected_at)) {
    errors.push('connected_at must be a valid ISO 8601 datetime string.');
  }
  if (!event.session_id || typeof event.session_id !== 'string') {
    errors.push('session_id is required and must be a string.');
  }
  if (
    event.attribution_model !== undefined &&
    !ALLOWED_ATTRIBUTION_MODELS.includes(event.attribution_model as typeof ALLOWED_ATTRIBUTION_MODELS[number])
  ) {
    errors.push(`attribution_model must be one of: ${ALLOWED_ATTRIBUTION_MODELS.join(', ')}.`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the Authorization header.
 * Expected format: "Bearer <writeKey>"
 */
export function validateWriteKey(
  authHeader: string | undefined,
  expectedKey: string
): boolean {
  if (!authHeader) return false;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return false;
  return parts[1] === expectedKey;
}
