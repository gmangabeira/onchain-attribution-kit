-- =============================================================================
-- 03_campaign_conversion_summary.sql
-- onchain-attribution-kit | Dune Analytics Query Pack
-- =============================================================================
--
-- PURPOSE:
--   Campaign-level aggregation. Rolls up attribution and conversion data
--   to produce the key metrics growth teams need for campaign reporting.
--
-- METRICS OUTPUT:
--   - wallets_captured: total attributed wallets per campaign/source/medium
--   - converted_wallets: wallets that performed at least one tracked on-chain action
--   - conversion_rate: converted_wallets / wallets_captured
--   - total_volume_usd: sum of on-chain transaction volume associated with attributed wallets
--   - first_action_count: total on-chain actions observed
--   - avg_hours_to_convert: median time from wallet connect to first on-chain action
--
-- REQUIRED INPUT:
--   - Paste the full CTEs from 01_campaign_wallets.sql and 02_first_onchain_action.sql
--     above this query, OR run them as separate Dune queries and reference the results.
--   - REPLACE `your_upload_table_name` in the raw_events CTE.
--
-- LIMITATIONS:
--   - Conversion rate is based on detected on-chain actions only. Actions on chains
--     or contracts not included in the Dune tables will not be counted.
--   - Volume figures are USD-denominated and depend on Dune's token price feeds.
--     Some small-cap or new tokens may have missing price data (NULL volume).
--   - Attribution is last-touch by default. First-touch would require filtering
--     the raw_events CTE on the earliest event per wallet, not latest.
--
-- =============================================================================

WITH raw_events AS (
  SELECT
    wallet_address,
    campaign_id,
    utm_source,
    utm_medium,
    utm_campaign,
    CAST(connected_at AS TIMESTAMP) AS connected_at
  FROM
    your_upload_table_name  -- REPLACE: your Dune CSV upload table name
),

campaign_wallets AS (
  SELECT
    wallet_address,
    FIRST_VALUE(campaign_id)  OVER w AS campaign_id,
    FIRST_VALUE(utm_source)   OVER w AS utm_source,
    FIRST_VALUE(utm_medium)   OVER w AS utm_medium,
    FIRST_VALUE(utm_campaign) OVER w AS utm_campaign,
    MIN(connected_at)         OVER w AS first_seen,
    ROW_NUMBER()              OVER w AS rn
  FROM raw_events
  WINDOW w AS (PARTITION BY wallet_address ORDER BY connected_at ASC)
),

attributed_wallets AS (
  SELECT * FROM campaign_wallets WHERE rn = 1
),

-- REPLACE: paste or reference your on-chain conversion data from 02_first_onchain_action.sql
-- For now this is a placeholder — replace wallet_address with your converted wallets subquery
conversions AS (
  SELECT
    wallet_address,
    'first_swap' AS action_type,  -- REPLACE: your action type(s)
    CAST(NULL AS TIMESTAMP) AS action_time,
    CAST(NULL AS DOUBLE) AS action_volume_usd
  FROM attributed_wallets
  WHERE 1 = 0  -- REPLACE: remove this filter when you add real conversion data
  -- EXAMPLE:
  -- SELECT
  --   taker AS wallet_address,
  --   'first_swap' AS action_type,
  --   MIN(block_time) AS action_time,
  --   SUM(amount_usd) AS action_volume_usd
  -- FROM dex.trades
  -- WHERE taker IN (SELECT wallet_address FROM attributed_wallets)
  -- GROUP BY taker
),

-- Aggregate at campaign / source / medium level
summary AS (
  SELECT
    COALESCE(aw.utm_campaign, '(not set)') AS utm_campaign,
    COALESCE(aw.utm_source,   '(not set)') AS utm_source,
    COALESCE(aw.utm_medium,   '(not set)') AS utm_medium,
    COUNT(DISTINCT aw.wallet_address)               AS wallets_captured,
    COUNT(DISTINCT c.wallet_address)                AS converted_wallets,
    ROUND(
      100.0 * COUNT(DISTINCT c.wallet_address) / NULLIF(COUNT(DISTINCT aw.wallet_address), 0),
      2
    ) AS conversion_rate_pct,
    ROUND(SUM(COALESCE(c.action_volume_usd, 0)), 2) AS total_volume_usd,
    COUNT(c.action_type)                             AS first_action_count,
    ROUND(
      AVG(DATE_DIFF('hour', aw.first_seen, c.action_time)),
      1
    ) AS avg_hours_to_convert,
    MODE() WITHIN GROUP (ORDER BY c.action_type) AS top_action_type
  FROM attributed_wallets aw
  LEFT JOIN conversions c ON aw.wallet_address = c.wallet_address
  GROUP BY
    COALESCE(aw.utm_campaign, '(not set)'),
    COALESCE(aw.utm_source,   '(not set)'),
    COALESCE(aw.utm_medium,   '(not set)')
)

SELECT
  utm_campaign,
  utm_source,
  utm_medium,
  wallets_captured,
  converted_wallets,
  conversion_rate_pct,
  total_volume_usd,
  first_action_count,
  avg_hours_to_convert,
  top_action_type
FROM summary
ORDER BY wallets_captured DESC;
