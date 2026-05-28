-- =============================================================================
-- 05_daily_attribution_timeseries.sql
-- onchain-attribution-kit | Dune Analytics Query Pack
-- =============================================================================
--
-- PURPOSE:
--   Daily time series of attributed wallet events by source and campaign.
--   Designed for Dune dashboard line charts and area charts.
--   Shows wallet capture velocity over time and conversion trends.
--
-- REQUIRED INPUT:
--   - REPLACE `your_upload_table_name` with your Dune CSV upload table name.
--   - Optional: extend with conversion data from 02_first_onchain_action.sql
--     to add a conversions_per_day series.
--
-- CHART RECOMMENDATIONS:
--   - Line chart: wallets_captured by date, grouped by utm_source
--   - Area chart: cumulative_wallets by date per campaign
--   - Bar chart: daily_conversions side-by-side with wallets_captured
--
-- LIMITATIONS:
--   - Gaps in dates (no events on a day) appear as gaps in Dune charts.
--     To fill gaps, use a date spine join. Example not included to keep query simple.
--   - If you have multiple campaigns running simultaneously, use a filter
--     on utm_campaign to isolate each one for cleaner charts.
--   - CSV upload timestamps are stored in UTC. Dune will display in UTC by default.
--
-- =============================================================================

WITH raw_events AS (
  SELECT
    wallet_address,
    campaign_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    CAST(connected_at AS TIMESTAMP) AS connected_at,
    DATE_TRUNC('day', CAST(connected_at AS TIMESTAMP)) AS event_date
  FROM
    your_upload_table_name  -- REPLACE: your Dune CSV upload table name
),

-- De-duplicate: one attribution event per wallet per day
-- If a wallet connected multiple times in a day, count it once
daily_unique_wallets AS (
  SELECT
    event_date,
    utm_campaign,
    utm_source,
    utm_medium,
    COUNT(DISTINCT wallet_address) AS wallets_captured
  FROM raw_events
  GROUP BY
    event_date,
    utm_campaign,
    utm_source,
    utm_medium
),

-- Cumulative wallets per campaign (useful for growth curve charts)
cumulative_series AS (
  SELECT
    event_date,
    utm_campaign,
    utm_source,
    utm_medium,
    wallets_captured,
    SUM(wallets_captured) OVER (
      PARTITION BY utm_campaign, utm_source, utm_medium
      ORDER BY event_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_wallets
  FROM daily_unique_wallets
)

SELECT
  event_date,
  COALESCE(utm_campaign, '(not set)') AS utm_campaign,
  COALESCE(utm_source, '(not set)')   AS utm_source,
  COALESCE(utm_medium, '(not set)')   AS utm_medium,
  wallets_captured,
  cumulative_wallets
FROM cumulative_series
ORDER BY
  utm_campaign,
  utm_source,
  event_date;
