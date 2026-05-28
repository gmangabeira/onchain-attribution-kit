# Limitations

Read this before drawing conclusions from attribution data. Attribution is inherently imperfect.
This kit helps you get directional signals, not ground truth.

## Last-touch attribution limits

The default attribution model is last-touch: the campaign that drove the final visit
before wallet connect gets full credit.

This means:
- A user who saw 5 pieces of content from 5 channels before connecting will credit only the last one.
- Organic re-engagement after a paid click appears as organic.
- Users who connect weeks after clicking a campaign link may have forgotten or been influenced
  by additional content in between.

First-touch attribution (crediting the first click) is available via `attributionModel: 'first_touch'`
in the config, but has symmetric limitations.

Neither model is correct. They are perspectives. Use them directionally.

## Multi-wallet identity limits

This kit tracks wallets, not people. One user with three wallets appears as three
separate attribution events with three separate wallet addresses.

There is no automatic solution to this. Merging wallet identities requires
probabilistic or on-chain graph analysis (e.g., shared funding source, same session).

Do not assume wallet count equals user count.

## Bot and sybil limits

This kit does not detect bots or sybil attackers automatically.
The wallet quality score in `04_channel_quality_score.sql` is a heuristic,
not a sybil detection system.

Indicators that require manual investigation:
- Large volume of wallet connects in a very short window (< 1 minute)
- All events sharing the same `referrer` or `landing_url`
- Wallet addresses that are brand new (created the same day as the event)
- Events with missing `landing_url` and `referrer`

The kit flags potential anomalies but does not auto-discard events.
Human review is required before removing wallets from reporting.

## Privacy and consent

This kit is designed to be privacy-respecting by default:
- No email addresses are collected
- No IP addresses are collected
- No device fingerprint is collected
- Opt-out is available via `window.ONCHAIN_ATTRIBUTION_DISABLED = true`

However, collecting wallet addresses and associating them with campaign data
may still be subject to privacy laws in your jurisdiction (GDPR, CCPA, etc.).

You are responsible for:
- Disclosing attribution tracking in your privacy policy
- Obtaining user consent where required by law
- Handling data deletion requests appropriately

This kit does not provide legal or compliance advice.

## Dune import and API limits

- Dune's free plan limits the number of query executions per day.
- CSV uploads have size limits (200 MB+ on paid plans; lower on free).
- Query results are not real-time. There is a delay between wallet connect and
  on-chain action confirmation on Dune.
- Some tokens and protocols are not indexed or have incomplete price data,
  resulting in NULL volume figures.

## Attribution window

Events are only captured if the user visits your site and connects their wallet
within the configured attribution window (default: 7 days).

If a user clicks a campaign link today and connects their wallet in 30 days,
the event will not be attributed to the campaign.

You can increase `ATTRIBUTION_WINDOW_DAYS` in `.env`, but longer windows
increase the risk of false attribution from stale campaign data.

## No cross-device tracking

If a user clicks a link on mobile but connects their wallet on desktop,
the `localStorage` context will not persist across devices.

The wallet connect event may be captured, but without campaign context.
