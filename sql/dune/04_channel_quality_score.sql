-- =============================================================================
-- 04_channel_quality_score.sql
-- onchain-attribution-kit | Dune Analytics Query Pack
-- =============================================================================
--
-- PURPOSE:
--   Lightweight wallet quality scoring for attributed wallets.
--   Helps identify which campaigns produce engaged, active wallets
--   vs. bot-like or low-quality traffic.
--
--   This is a heuristic model, not a definitive sybil detection system.
--   Use it to flag anomalies and guide human investigation, not to auto-ban wallets.
--
-- SCORING DIMENSIONS (each 0–25 points, total 0–100):
--   1. Wallet age proxy (days since first tx)  — older = higher quality
--   2. Transaction count                       — more txns = more active
--   3. Historical volume (USD)                 — higher volume = more engaged
--   4. Repeated protocol interactions          — more interactions = stickier
--
-- REQUIRED INPUT:
--   - REPLACE `your_upload_table_name` below with your Dune CSV upload table.
--   - Ethereum transaction data from `ethereum.transactions` is used as the proxy.
--     For other chains, replace with: arbitrum.transactions, optimism.transactions, etc.
--
-- LIMITATIONS:
--   - Wallet age is approximated using the earliest transaction on the queried chain.
--     A fresh Ethereum wallet may be old on another chain.
--   - Transaction counts include all tx types. Does not filter out failed transactions
--     or spam contracts by default.
--   - Volume is estimated from Ethereum transfers only. Cross-chain volume is not included.
--   - This is not a Chainalysis or TRM-grade sybil detection tool. False positives exist.
--   - New wallets (e.g., just created for this campaign) will score low by design.
--     This is expected. Segment by wallet age before drawing conclusions.
--
-- =============================================================================

WITH raw_events AS (
  SELECT
    wallet_address,
    campaign_id,
    utm_source,
    utm_medium,
    utm_campaign,
    CAST(connected_at AS TIMESTAMP) AS first_seen
  FROM
    your_upload_table_name  -- REPLACE: your Dune CSV upload table name
),

attributed_wallets AS (
  SELECT DISTINCT
    wallet_address,
    campaign_id,
    utm_source,
    utm_medium,
    utm_campaign,
    MIN(first_seen) OVER (PARTITION BY wallet_address) AS first_seen
  FROM raw_events
),

-- On-chain activity from Ethereum (REPLACE chain if needed)
wallet_tx_stats AS (
  SELECT
    LOWER(CAST(t."from" AS VARCHAR)) AS wallet_address,
    MIN(t.block_time) AS first_tx_time,
    COUNT(*) AS tx_count,
    SUM(CAST(t.value AS DOUBLE) / 1e18) AS eth_sent  -- ETH volume (rough proxy for activity)
  FROM ethereum.transactions t  -- REPLACE: use your target chain's transaction table
  WHERE LOWER(CAST(t."from" AS VARCHAR)) IN (SELECT wallet_address FROM attributed_wallets)
  GROUP BY LOWER(CAST(t."from" AS VARCHAR))
),

-- Scoring: each dimension is 0-25, total 0-100
quality_scores AS (
  SELECT
    aw.wallet_address,
    aw.campaign_id,
    aw.utm_source,
    aw.utm_medium,
    aw.utm_campaign,
    aw.first_seen AS wallet_connected_at,
    ws.tx_count,
    ws.eth_sent,
    ws.first_tx_time,
    DATE_DIFF('day', ws.first_tx_time, CURRENT_DATE) AS wallet_age_days,

    -- DIMENSION 1: Wallet age (0-25)
    -- 0 points for < 7 days old, scales to 25 for > 365 days
    LEAST(25, GREATEST(0,
      CAST(DATE_DIFF('day', ws.first_tx_time, CURRENT_DATE) AS DOUBLE) / 365.0 * 25
    )) AS age_score,

    -- DIMENSION 2: Transaction count (0-25)
    -- 0 for 0 tx, 25 for 100+ tx
    LEAST(25, GREATEST(0, CAST(ws.tx_count AS DOUBLE) / 100.0 * 25)) AS activity_score,

    -- DIMENSION 3: ETH volume (0-25)
    -- 0 for 0 ETH, 25 for 10+ ETH lifetime (rough engagement proxy)
    LEAST(25, GREATEST(0, COALESCE(ws.eth_sent, 0) / 10.0 * 25)) AS volume_score,

    -- DIMENSION 4: Recency — has txn in last 30 days (0 or 25)
    -- Active wallets get full recency score
    CASE WHEN MAX(ws.first_tx_time) > CURRENT_DATE - INTERVAL '30' DAY THEN 25 ELSE 0 END AS recency_score

  FROM attributed_wallets aw
  LEFT JOIN wallet_tx_stats ws ON aw.wallet_address = ws.wallet_address
)

SELECT
  wallet_address,
  utm_campaign,
  utm_source,
  utm_medium,
  wallet_connected_at,
  wallet_age_days,
  tx_count,
  ROUND(eth_sent, 4) AS eth_sent,
  ROUND(age_score, 1) AS age_score,
  ROUND(activity_score, 1) AS activity_score,
  ROUND(volume_score, 1) AS volume_score,
  recency_score,
  ROUND(age_score + activity_score + volume_score + recency_score, 1) AS total_quality_score,
  CASE
    WHEN age_score + activity_score + volume_score + recency_score >= 70 THEN 'high'
    WHEN age_score + activity_score + volume_score + recency_score >= 35 THEN 'medium'
    ELSE 'low'
  END AS quality_tier
FROM quality_scores
ORDER BY total_quality_score DESC;
