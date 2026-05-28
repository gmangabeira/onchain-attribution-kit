/**
 * onchain-attribution-kit: import-events-csv.ts
 *
 * Imports attribution events from a CSV file into the local JSONL store.
 * Useful for migrating historical data or importing events from another system.
 *
 * Usage:
 *   ts-node scripts/import-events-csv.ts --input data/sample-events.csv
 *   npm run import:events
 *
 * The CSV must have headers matching the canonical column order.
 * See src/server/storage.ts CSV_HEADERS for the expected columns.
 */

import * as fs from 'fs';
import * as path from 'path';
import { LocalFileAdapter, CSV_HEADERS } from '../src/server/storage';
import { AttributionEvent } from '../src/capture/wallet-listener';

function parseArgs(): { input: string; output: string } {
  const args = process.argv.slice(2);
  let input = 'data/sample-events.csv';
  let output = process.env['EVENTS_FILE'] ?? 'data/events.jsonl';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      input = args[i + 1];
      i++;
    }
    if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }

  return { input, output };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

function rowToEvent(headers: string[], values: string[]): AttributionEvent | null {
  const get = (key: string): string => values[headers.indexOf(key)] ?? '';
  const getNullable = (key: string): string | null => {
    const v = get(key);
    return v === '' ? null : v;
  };

  const walletAddress = get('wallet_address');
  const eventId = get('event_id');

  if (!walletAddress || !eventId) return null;

  const chainIdRaw = get('chain_id');
  const chainId = chainIdRaw ? parseInt(chainIdRaw, 10) : null;

  return {
    event_id: eventId,
    event_type: 'wallet_connected',
    wallet_address: walletAddress,
    chain_id: chainId && !isNaN(chainId) ? chainId : null,
    connected_at: get('connected_at') || new Date().toISOString(),
    session_id: get('session_id') || eventId,
    landing_url: get('landing_url'),
    referrer: get('referrer'),
    utm_source: getNullable('utm_source'),
    utm_medium: getNullable('utm_medium'),
    utm_campaign: getNullable('utm_campaign'),
    utm_content: getNullable('utm_content'),
    utm_term: getNullable('utm_term'),
    campaign_id: getNullable('campaign_id'),
    ref: getNullable('ref'),
    kol: getNullable('kol'),
    source_wallet: getNullable('source_wallet'),
    attribution_model: (get('attribution_model') as 'last_touch' | 'first_touch') || 'last_touch',
    metadata: {},
  };
}

async function run(): Promise<void> {
  const { input, output } = parseArgs();
  const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);

  if (lines.length < 2) {
    console.error('CSV file is empty or has no data rows.');
    process.exit(1);
  }

  const headers = parseCsvLine(lines[0]);
  console.log(`CSV headers: ${headers.join(', ')}`);

  // Validate headers
  const missing = CSV_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    console.warn(`Missing expected columns: ${missing.join(', ')}`);
    console.warn('Import will continue but some fields may be empty.');
  }

  const adapter = new LocalFileAdapter(output);
  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const event = rowToEvent(headers, values);

    if (!event) {
      console.warn(`Row ${i}: skipped (missing event_id or wallet_address)`);
      skipped++;
      continue;
    }

    await adapter.save(event);
    imported++;
  }

  console.log(`\nImport complete: ${imported} events imported, ${skipped} skipped.`);
  console.log(`Output: ${output}`);
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
