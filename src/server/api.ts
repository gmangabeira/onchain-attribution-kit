/**
 * onchain-attribution-kit: api.ts
 *
 * Minimal Express server. Receives attribution events from the browser snippet,
 * validates them, and stores them locally.
 *
 * Routes:
 *   POST /api/attribution/event  — receive and store an attribution event
 *   GET  /api/health             — health check
 *   GET  /api/events.csv         — local dev only: return stored events as CSV
 *
 * Start:
 *   npm run dev
 *   ts-node src/server/api.ts
 */

import express, { Request, Response, NextFunction } from 'express';
import { validateEvent, validateWriteKey } from './validation';
import { LocalFileAdapter } from './storage';
import { AttributionEvent } from '../capture/wallet-listener';

const app = express();
app.use(express.json({ limit: '256kb' }));

// CORS — allow all origins for local dev; lock down in production
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const WRITE_KEY = process.env['ONCHAIN_ATTRIBUTION_WRITE_KEY'] ?? '';
const EVENTS_FILE = process.env['EVENTS_FILE'] ?? 'data/events.jsonl';
const IS_DEV = process.env['NODE_ENV'] !== 'production';

if (!WRITE_KEY) {
  console.warn(
    '[onchain-attribution] WARNING: ONCHAIN_ATTRIBUTION_WRITE_KEY is not set. ' +
    'All authenticated requests will be rejected.'
  );
}

const storage = new LocalFileAdapter(EVENTS_FILE);

// --- Routes ---

/**
 * POST /api/attribution/event
 * Accepts an attribution event payload from the browser snippet.
 */
app.post('/api/attribution/event', (req: Request, res: Response) => {
  // Auth
  if (WRITE_KEY && !validateWriteKey(req.headers['authorization'], WRITE_KEY)) {
    res.status(401).json({ error: 'Unauthorized. Invalid or missing write key.' });
    return;
  }

  // Validate
  const { valid, errors } = validateEvent(req.body);
  if (!valid) {
    res.status(400).json({ error: 'Invalid event payload.', details: errors });
    return;
  }

  const event = req.body as AttributionEvent;

  // Store
  storage.save(event).then(() => {
    console.log(
      `[${new Date().toISOString()}] event stored | ` +
      `wallet=${event.wallet_address} | campaign=${event.utm_campaign ?? 'none'} | ` +
      `source=${event.utm_source ?? 'none'}`
    );
    res.status(201).json({ ok: true, event_id: event.event_id });
  }).catch((err: Error) => {
    console.error('[onchain-attribution] Storage error:', err.message);
    res.status(500).json({ error: 'Failed to store event.' });
  });
});

/**
 * GET /api/health
 * Simple health check used by monitoring, CI, and the static HTML example.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/events.csv
 * Returns stored events as CSV. Local development only.
 * Disable this route in production by setting NODE_ENV=production.
 */
app.get('/api/events.csv', (_req: Request, res: Response) => {
  if (!IS_DEV) {
    res.status(403).json({ error: 'CSV export is disabled in production.' });
    return;
  }

  const csv = storage.readCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="events.csv"');
  res.send(csv);
});

// Serve the static HTML example in dev mode
if (IS_DEV) {
  app.use(express.static('src/examples/static-html'));
}

// --- Start ---
app.listen(PORT, () => {
  console.log(`[onchain-attribution] Server running at http://localhost:${PORT}`);
  console.log(`  POST /api/attribution/event — receive events`);
  console.log(`  GET  /api/health            — health check`);
  if (IS_DEV) {
    console.log(`  GET  /api/events.csv        — download events (dev only)`);
    console.log(`  GET  /                      — static HTML example`);
  }
});

export default app;
