/**
 * onchain-attribution-kit: storage.ts
 *
 * Interface-based storage layer.
 * Default implementation: append-only JSONL file at data/events.jsonl.
 * Also writes a CSV mirror for easy Dune upload.
 *
 * To use Postgres/Supabase, implement the StorageAdapter interface and
 * swap the default in api.ts.
 */

import * as fs from 'fs';
import * as path from 'path';
import { AttributionEvent } from '../capture/wallet-listener';

export interface StorageAdapter {
  save(event: AttributionEvent): Promise<void>;
  readAll(): Promise<AttributionEvent[]>;
}

/** CSV column order — must match csvRow() */
export const CSV_HEADERS = [
  'event_id',
  'event_type',
  'wallet_address',
  'chain_id',
  'connected_at',
  'session_id',
  'landing_url',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'campaign_id',
  'ref',
  'kol',
  'source_wallet',
  'attribution_model',
];

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(event: AttributionEvent): string {
  return [
    event.event_id,
    event.event_type,
    event.wallet_address,
    event.chain_id,
    event.connected_at,
    event.session_id,
    event.landing_url,
    event.referrer,
    event.utm_source,
    event.utm_medium,
    event.utm_campaign,
    event.utm_content,
    event.utm_term,
    event.campaign_id,
    event.ref,
    event.kol,
    event.source_wallet,
    event.attribution_model,
  ]
    .map(csvEscape)
    .join(',');
}

/**
 * Default local file storage adapter.
 * Appends events as newline-delimited JSON (JSONL) and mirrors to CSV.
 */
export class LocalFileAdapter implements StorageAdapter {
  private jsonlPath: string;
  private csvPath: string;

  constructor(eventsFile = 'data/events.jsonl') {
    // Support relative or absolute paths
    this.jsonlPath = path.isAbsolute(eventsFile)
      ? eventsFile
      : path.join(process.cwd(), eventsFile);
    this.csvPath = this.jsonlPath.replace(/\.jsonl$/, '.csv');

    this.ensureDir();
    this.ensureCsvHeader();
  }

  private ensureDir(): void {
    const dir = path.dirname(this.jsonlPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private ensureCsvHeader(): void {
    if (!fs.existsSync(this.csvPath)) {
      fs.writeFileSync(this.csvPath, CSV_HEADERS.join(',') + '\n', 'utf-8');
    }
  }

  async save(event: AttributionEvent): Promise<void> {
    // Append to JSONL
    fs.appendFileSync(this.jsonlPath, JSON.stringify(event) + '\n', 'utf-8');
    // Append to CSV
    fs.appendFileSync(this.csvPath, toCsvRow(event) + '\n', 'utf-8');
  }

  async readAll(): Promise<AttributionEvent[]> {
    if (!fs.existsSync(this.jsonlPath)) return [];

    const raw = fs.readFileSync(this.jsonlPath, 'utf-8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AttributionEvent);
  }

  readCsv(): string {
    if (!fs.existsSync(this.csvPath)) {
      return CSV_HEADERS.join(',') + '\n';
    }
    return fs.readFileSync(this.csvPath, 'utf-8');
  }
}
