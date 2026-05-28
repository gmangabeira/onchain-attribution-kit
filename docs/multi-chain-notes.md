# Multi-Chain Notes

## EVM chain IDs

The `chain_id` field in attribution events identifies the chain the user connected on.
Pass this from your wallet connect handler.

Common EVM chain IDs:

| Chain | chain_id |
|---|---|
| Ethereum Mainnet | 1 |
| Arbitrum One | 42161 |
| Optimism | 10 |
| Base | 8453 |
| Polygon | 137 |
| zkSync Era | 324 |
| Linea | 59144 |
| Scroll | 534352 |
| Avalanche C-Chain | 43114 |
| BNB Smart Chain | 56 |
| Gnosis Chain | 100 |

Full list: [chainlist.org](https://chainlist.org)

## Cross-chain caveats

### Users may connect on one chain and transact on another

A user might connect their wallet on Ethereum but hold funds on Arbitrum.
The attribution event will capture `chain_id: 1`, but their first on-chain action
may happen on `chain_id: 42161`.

Mitigation:
- Run Dune queries against the chain where your protocol is deployed.
- If your protocol is multi-chain, run the conversion queries for each chain separately.

### Bridge transactions are not automatically attributed

If a user bridges funds from Ethereum to Base and then uses your Base app,
the bridge transaction will not be linked to the attribution event unless
you explicitly track it.

### Dune cross-chain joins

Dune has separate tables per chain. To join attribution data across chains:
- Join on `wallet_address` across `ethereum.transactions`, `arbitrum.transactions`, etc.
- Use `UNION ALL` to combine results before joining with your attribution CTE.

## Aggregator caveats

Users who trade via 1inch, Paraswap, Matcha, or other aggregators will appear
in `dex.trades` with the aggregator contract as `maker` and their wallet as `taker`.
The kit's queries filter on `taker` to capture the end user — but verify this
behavior against your specific protocol.

## Multi-wallet caveats

Some users connect multiple wallet addresses (hardware wallet, hot wallet, team wallet).
Each wallet appears as a separate attribution event. There is no automatic multi-wallet
identity resolution in this kit.

Indicators of multi-wallet users:
- Same `session_id` with different `wallet_address`
- Same `referrer` or `landing_url` pattern across multiple wallets in a short window

Do not merge wallet identities automatically. Flag them for human review only.
