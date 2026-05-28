# Dune Analytics Setup

## Overview

The onchain-attribution-kit provides 5 SQL query templates for Dune Analytics.
These queries join your attribution events (uploaded as CSV) with on-chain data
to produce campaign metrics, conversion rates, and wallet quality scores.

## Step 1: Export your attribution events

After collecting events with the local server, export the CSV:

```bash
# Download events CSV (server must be running)
curl http://localhost:3000/api/events.csv -o attribution-events.csv

# Or copy directly from the file
cp data/events.csv attribution-events.csv
```

## Step 2: Upload the CSV to Dune

1. Go to [dune.com](https://dune.com) and log in.
2. Click your profile icon > "My Uploads" or go to [dune.com/data/upload](https://dune.com/data/upload).
3. Upload `attribution-events.csv`.
4. Note the generated table name. It will look like:
   `dune.your_username.dataset_attribution_events_...`

## Step 3: Run the queries

Open the Dune query editor and paste each SQL file from `sql/dune/`.

**Replace the placeholder in every query:**
```sql
your_upload_table_name  -- REPLACE: your Dune CSV upload table name
```

With your actual table name, e.g.:
```sql
dune.gabriel_mangabeira.dataset_attribution_events_2026_05
```

### Query execution order

Run queries in this order — later queries depend on the earlier ones:

1. `01_campaign_wallets.sql` — base attribution table
2. `02_first_onchain_action.sql` — first on-chain action per wallet
3. `03_campaign_conversion_summary.sql` — campaign-level metrics
4. `04_channel_quality_score.sql` — wallet quality scores
5. `05_daily_attribution_timeseries.sql` — daily chart data

## Step 4: Adapt protocol-specific sections

Queries 2 and 4 include protocol-specific placeholders. Look for comments like:
```sql
-- REPLACE: your protocol contract address here
-- REPLACE: your Dune CSV upload table name
```

For EVM protocols, common tables to use:
- `dex.trades` — swap events across major DEXes
- `tokens.transfers` — ERC-20 token transfers
- `ethereum.transactions` — all Ethereum transactions
- `[protocol]_[chain].Pool_evt_[EventName]` — protocol-specific events

Find your protocol's Dune tables by searching the Dune data explorer.

## Step 5: Build a dashboard

1. Create a new Dune dashboard: [dune.com/browse/dashboards](https://dune.com/browse/dashboards) > New Dashboard.
2. Add your saved queries as visualizations.
3. Recommended visualization types:
   - Query 3 (summary): Bar chart by utm_campaign, sorted by wallets_captured
   - Query 5 (timeseries): Line chart, x=event_date, y=wallets_captured, color=utm_source
   - Query 4 (quality): Scatter plot, x=total_quality_score, y=utm_campaign

## Keeping data fresh

Dune does not poll your events file automatically. To refresh:

1. Re-export events CSV from your server.
2. Re-upload to Dune (replace the existing upload or use a versioned name).
3. Update the table name in your queries if it changed.
4. Re-execute queries.

For automated refreshes, consider:
- Exporting to a Supabase/Postgres table with the Dune API (paid feature)
- Running a cron job that exports and re-uploads the CSV
- Using Dune's query scheduling feature (Dune+ plan)

## Dune API limits

- Free plan: limited query runs per day
- CSV uploads: up to 200 MB per file
- Row limits: vary by plan

See [Dune documentation](https://docs.dune.com) for current limits.
