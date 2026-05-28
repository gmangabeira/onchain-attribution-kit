# Campaign Schema and UTM Taxonomy

## UTM parameter guide

Use these fields consistently across all campaign links. Inconsistent naming is the
most common reason attribution data becomes unusable.

| Parameter | Required | Description | Example |
|---|---|---|---|
| `utm_source` | Yes | Traffic origin platform | `x`, `discord`, `telegram`, `farcaster`, `email`, `referral` |
| `utm_medium` | Yes | Marketing medium / channel type | `social`, `community`, `cpc`, `kol`, `quest`, `referral` |
| `utm_campaign` | Yes | Campaign name or slug | `launch-q2-2026`, `quest-may`, `conference-ethdenver` |
| `utm_content` | Recommended | Ad or post variant | `thread-01`, `post-kol-alpha`, `banner-v2` |
| `utm_term` | Optional | Keyword (paid search only) | Usually blank for Web3 |

## Crypto-native params

These are additional parameters recognized by the capture snippet:

| Parameter | Description | Example |
|---|---|---|
| `ref` | Referral code or source wallet | `0xd8da6b...` or `alice` |
| `invite` | Invite code from referral program | `INV-8XK2` |
| `kol` | KOL / influencer identifier | `influencer_0x1`, `cryptotrader42` |
| `campaign_id` | Internal campaign ID matching your records | `launch-q2-2026` |
| `source_wallet` | Protocol wallet that initiated the referral | `0x742d35...` |

## Recommended naming conventions

### Sources

Use lowercase slugs. No spaces. No special characters.

| Platform | Use |
|---|---|
| X / Twitter | `x` |
| Discord | `discord` |
| Telegram | `telegram` |
| Farcaster | `farcaster` |
| Reddit | `reddit` |
| Email / Newsletter | `email` |
| KOL or influencer | `kol` (use `kol` param for the individual) |
| Quest platform (Galxe, etc.) | `galxe`, `zealy`, `layer3` |
| On-chain referral | `referral` |
| Direct / typed | `direct` (usually captured automatically) |

### Mediums

| Channel type | Use |
|---|---|
| Organic social posts | `social` |
| Community posts (Discord, Telegram) | `community` |
| Paid social / CPC | `cpc` |
| KOL-driven traffic | `kol` |
| Quest or incentive program | `quest` |
| On-chain referral program | `referral` |
| Email campaign | `email` |
| Conference / event | `conference` |

### Campaign naming

Format: `[initiative]-[timeframe]` or `[initiative]-[variant]`

Examples:
- `launch-q2-2026`
- `quest-may-2026`
- `conference-ethdenver-2026`
- `airdrop-s2`
- `kol-campaign-alpha`

Avoid:
- Spaces or special characters in campaign names
- Changing campaign names mid-run (it splits the attribution)
- Generic names like `test`, `campaign1`

## Example UTM link templates

### X / Twitter thread

```
https://yourprotocol.xyz/?utm_source=x&utm_medium=social&utm_campaign=launch-q2-2026&utm_content=thread-01
```

### Discord community post

```
https://yourprotocol.xyz/?utm_source=discord&utm_medium=community&utm_campaign=quest-may&utm_content=server-main
```

### Telegram announcement

```
https://yourprotocol.xyz/?utm_source=telegram&utm_medium=community&utm_campaign=launch-q2-2026
```

### KOL post

```
https://yourprotocol.xyz/?utm_source=x&utm_medium=kol&utm_campaign=launch-q2-2026&kol=influencer_handle
```

### Referral link

```
https://yourprotocol.xyz/?utm_source=referral&utm_medium=referral&utm_campaign=launch-q2-2026&ref=WALLETADDRESS
```

### Farcaster frame or cast

```
https://yourprotocol.xyz/?utm_source=farcaster&utm_medium=social&utm_campaign=launch-q2-2026
```

### Quest platform (Galxe, Zealy, Layer3)

```
https://yourprotocol.xyz/?utm_source=galxe&utm_medium=quest&utm_campaign=quest-may
```
