# Troubleshooting

## Wallet not captured

**Symptom:** Wallet connects but no event appears in `data/events.jsonl`.

Checklist:
1. Is the server running? `npm run dev`
2. Is `window.ONCHAIN_ATTRIBUTION_DISABLED` set to `true` somewhere? Check browser console.
3. Is the `ONCHAIN_ATTRIBUTION_WRITE_KEY` in `.env` matching the key sent in the `Authorization` header?
4. Open browser DevTools > Network. Look for a POST to `/api/attribution/event`. Check the response.
5. Is the wallet address a valid Ethereum address (0x + 40 hex chars)?
6. Is there a CORS error? The server allows all origins in dev mode. In production, configure CORS appropriately.

## UTMs missing from event

**Symptom:** Events are stored but `utm_source`, `utm_campaign`, etc. are all null.

Checklist:
1. Did you open the page with UTM params in the URL? Test with:
   `http://localhost:3000/?utm_source=x&utm_medium=social&utm_campaign=test`
2. Are UTM params being stripped by your hosting or CDN? Some redirect configs strip query params.
3. Is `initAttribution()` being called on page load? Check the browser console for the `[onchain-attribution]` prefix.
4. Is the attribution window expired? The default is 7 days. Check `ATTRIBUTION_WINDOW_DAYS` in `.env`.
5. In a multi-page app: are you calling `initAttribution()` on the page where UTMs arrive, not only on the wallet connect page?

## Alert not sending

**Symptom:** `npm run test:alert` runs but no message arrives.

Checklist:

**Telegram:**
1. Is `TELEGRAM_BOT_TOKEN` set and not empty?
2. Is `TELEGRAM_CHAT_ID` set correctly? For groups it starts with `-100`.
3. Have you sent at least one message to the bot? (Required before bots can reply to you.)
4. Try `--dry-run` to verify the message formats correctly before sending.

**Discord:**
1. Is `DISCORD_WEBHOOK_URL` set and not expired? Webhooks can be deleted from the Discord UI.
2. Does the webhook URL start with `https://discord.com/api/webhooks/`?

**Slack:**
1. Is `SLACK_WEBHOOK_URL` set and active? Check at [api.slack.com/apps](https://api.slack.com/apps).
2. Is the app installed to your workspace?

**All channels:**
- Add `console.log` in `send-test-alert.ts` to see the raw response from each channel.
- Check `ALERT_CHANNELS` in `.env` — only channels listed here will be sent to.

## Dune query returns zero rows

**Symptom:** You uploaded the CSV but the query returns no data.

Checklist:
1. Is the table name in the query matching your Dune upload table name exactly?
   Find it in Dune > My Uploads.
2. Did the CSV upload complete successfully? Dune shows a green checkmark when done.
3. Does the CSV have the correct header row? Compare with `data/sample-events.csv`.
4. Is the `connected_at` column in ISO 8601 format? (`2026-05-28T12:00:00Z`)
5. Try: `SELECT * FROM your_upload_table_name LIMIT 10` to confirm the table is accessible.

## CORS or API issues

**Symptom:** Browser shows CORS errors when POSTing to `/api/attribution/event`.

The server allows all origins in development mode by default.

If you see CORS errors:
1. Confirm the server is running on the port in your `Attribution` config.
2. In production, configure CORS explicitly in `api.ts` to allow your frontend domain.

Example for production:
```typescript
// In api.ts, replace the wildcard CORS middleware with:
app.use(cors({ origin: 'https://yourprotocol.xyz' }));
```

## TypeScript errors on build

Run:
```bash
npm run typecheck
```

Common issues:
- `Cannot find module 'uuid'` — run `npm install`
- `Type error in send-test-alert.ts` — the scripts folder is excluded from `tsconfig.json`
  but ts-node should still work. Run `npx ts-node scripts/send-test-alert.ts --dry-run`.
