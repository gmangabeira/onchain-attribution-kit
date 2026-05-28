-- =============================================================================
-- 02_first_onchain_action.sql
-- onchain-attribution-kit | Dune Analytics Query Pack
-- =============================================================================
--
-- PURPOSE:
--   Finds the first relevant on-chain action for each attributed wallet.
--   Joins campaign attribution data (from 01_campaign_wallets.sql) with
--   on-chain event tables in Dune to identify conversion events.
--
-- REQUIRED INPUT:
--   - campaign_wallets CTE from 01_campaign_wallets.sql (included below)
--   - REPLACE the upload table name in the raw_events CTE
--
-- REPLACE-ME VARIABLES:
--   - `your_upload_table_name`: your Dune CSV upload table name
--   - `your_protocol_address_here`: the smart contract address for your protocol
--   - `your_protocol_event_table`: optional, replace with a protocol-specific table
--     (e.g., uniswap_v3_ethereum.Swap, aave_v3_ethereum.Supply)
--
-- EXAMPLE ACTIONS TRACKED:
--   This query shows EVM examples using:
--   - dex.trades: DEX swaps (protocol-agnostic, covers Uniswap, Curve, Balancer, etc.)
--   - tokens.transfers: any ERC-20 token transfer
--   Replace or extend with your protocol's tables as needed.
--
-- LIMITATIONS:
--   - Only covers EVM-compatible chains indexed in Dune (Ethereum, Arbitrum,
--     Optimism, Polygon, Base, etc.).
--   - Does not track native token (ETH) transfers — only contract interactions.
--   - Attribution is probabilistic: a wallet appearing in both your events CSV
--     and Dune tables does not guarantee the campaign caused the on-chain action.
--     Use language like "associated with" or "likely influenced" in reporting.
--   - Cross-chain activity (e.g., bridge first, then swap on another chain) requires
--     matching wallet addresses across chains; this query is single-chain.
--
-- =============================================================================

WITH raw_events AS (
  -- REPLACE: paste the raw_events CTE from 01_campaign_wallets.sql here,
  -- or run 01_campaign_wallets.sql as a separate query and reference it.
  SELECT
    wallet_address,
    campaign_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    ref,
    kol,
    CAST(connected_at AS TIMESTAMP) AS connected_at,
    TRY_CAST(chain_id AS INTEGER) AS chain_id
  FROM
    your_upload_table_name  -- REPLACE: your Dune CSV upload table name
),

campaign_wallets AS (
  SELECT
    wallet_address,
    FIRST_VALUE(campaign_id)   OVER w AS campaign_id,
    FIRST_VALUE(utm_source)    OVER w AS utm_source,
    FIRST_VALUE(utm_medium)    OVER w AS utm_medium,
    FIRST_VALUE(utm_campaign)  OVER w AS utm_campaign,
    FIRST_VALUE(utm_content)   OVER w AS utm_content,
    FIRST_VALUE(ref)           OVER w AS ref,
    FIRST_VALUE(kol)           OVER w AS kol,
    MIN(connected_at)          OVER w AS first_seen,
    ROW_NUMBER()               OVER w AS rn
  FROM raw_events
  WINDOW w AS (PARTITION BY wallet_address ORDER BY connected_at ASC)
),

attributed_wallets AS (
  SELECT * FROM campaign_wallets WHERE rn = 1
),

-- DEX TRADES: first swap after wallet connect
-- Uses dex.trades which covers major DEXes across chains.
-- REPLACE: filter by project/version/chain if needed.
dex_first_action AS (
  SELECT
    t.taker AS wallet_address,
    'first_swap' AS action_type,
    MIN(t.block_time) AS action_time,
    SUM(t.amount_usd) AS action_volume_usd
  FROM dex.trades t
  INNER JOIN attributed_wallets aw
    ON LOWER(CAST(t.taker AS VARCHAR)) = LOWER(aw.wallet_address)
  WHERE
    t.block_time > aw.first_seen
    -- REPLACE (optional): uncomment and set your chain filter
    -- AND t.blockchain = 'ethereum'
    -- REPLACE (optional): filter by specific protocol
    -- AND t.project = 'uniswap'
    -- AND t.project_contract_address = 0x_your_protocol_address_here
  GROUP BY t.taker
),

-- TOKEN TRANSFERS: first inbound or outbound ERC-20 transfer after wallet connect
-- Can be used to track first deposit, first claim, first stake, etc.
-- REPLACE: adjust direction (to / from) and token address for your use case.
transfer_first_action AS (
  SELECT
    LOWER(CAST(tr."to" AS VARCHAR)) AS wallet_address,
    'first_transfer' AS action_type,
    MIN(tr.evt_block_time) AS action_time,
    NULL AS action_volume_usd
  FROM tokens.transfers tr
  INNER JOIN attributed_wallets aw
    ON LOWER(CAST(tr."to" AS VARCHAR)) = LOWER(aw.wallet_address)
  WHERE
    tr.evt_block_time > aw.first_seen
    -- REPLACE: your token contract address
    -- AND tr.contract_address = 0x_your_token_address_here
  GROUP BY tr."to"
),

-- PROTOCOL-SPECIFIC EVENTS (Optional)
-- Uncomment and replace with your protocol's event table.
-- Example: Aave V3 Supply event on Ethereum
--
-- protocol_first_action AS (
--   SELECT
--     LOWER(CAST(evt.user AS VARCHAR)) AS wallet_address,
--     'first_deposit' AS action_type,
--     MIN(evt.evt_block_time) AS action_time,
--     SUM(CAST(evt.amount AS DOUBLE) / 1e18) AS action_volume_usd
--   FROM aave_v3_ethereum.Pool_evt_Supply evt  -- REPLACE: your protocol event table
--   INNER JOIN attributed_wallets aw
--     ON LOWER(CAST(evt.user AS VARCHAR)) = LOWER(aw.wallet_address)
--   WHERE
--     evt.evt_block_time > aw.first_seen
--     AND evt.reserve = 0x_your_protocol_address_here  -- REPLACE: token/reserve address
--   GROUP BY evt.user
-- ),

-- Combine action signals; prefer the earliest action regardless of type
combined_actions AS (
  SELECT * FROM dex_first_action
  UNION ALL
  SELECT * FROM transfer_first_action
  -- UNION ALL SELECT * FROM protocol_first_action  -- uncomment if using protocol events
),

first_action_per_wallet AS (
  SELECT
    wallet_address,
    FIRST_VALUE(action_type) OVER (PARTITION BY wallet_address ORDER BY action_time ASC) AS first_action_type,
    MIN(action_time) OVER (PARTITION BY wallet_address) AS first_action_time,
    SUM(COALESCE(action_volume_usd, 0)) OVER (PARTITION BY wallet_address) AS total_volume_usd,
    ROW_NUMBER() OVER (PARTITION BY wallet_address ORDER BY action_time ASC) AS rn
  FROM combined_actions
)

-- Final output: one row per attributed wallet with first action details
SELECT
  aw.wallet_address,
  aw.campaign_id,
  aw.utm_source,
  aw.utm_medium,
  aw.utm_campaign,
  aw.first_seen AS wallet_connected_at,
  faw.first_action_type,
  faw.first_action_time,
  DATE_DIFF('hour', aw.first_seen, faw.first_action_time) AS hours_to_convert,
  faw.total_volume_usd,
  CASE WHEN faw.first_action_type IS NOT NULL THEN TRUE ELSE FALSE END AS converted
FROM attributed_wallets aw
LEFT JOIN first_action_per_wallet faw
  ON aw.wallet_address = faw.wallet_address AND faw.rn = 1
ORDER BY aw.first_seen DESC;
