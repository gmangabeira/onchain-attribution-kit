# Product Hunt Launch Assets

## Tagline

> Open-source attribution for Web3 campaigns.

## Short description (under 260 characters)

> Capture UTMs at wallet connect, join campaigns to on-chain activity in Dune, and alert your team in Telegram, Discord, or Slack. Free, open-source, deployable in ~30 minutes.

## Longer description (for Product Hunt body)

Most Web3 teams can see clicks. They can see on-chain activity. The hard part is connecting the two.

`onchain-attribution-kit` is a free, open-source starting point for that gap. It gives growth teams a practical baseline for tracking which campaigns produce real wallet activity and downstream on-chain actions.

**What it includes:**

- UTM + crypto-native param capture at wallet connect (browser snippet)
- Minimal event receiver with local JSONL and CSV storage
- 5 Dune SQL query templates: base wallets, first on-chain action, conversion summary, wallet quality scoring, daily time series
- Alert modules for Telegram, Discord, and Slack
- Claude Code agent template for daily attribution operations

**What it is not:**

- Not a SaaS dashboard
- Not a hosted analytics service
- Not a sybil detection tool
- Does not promise perfect attribution

It is a practical starter kit for protocols and agencies who want to stop guessing which campaigns drive real wallet activity.

## Maker comment

```
Most Web3 teams can see clicks. They can see on-chain activity. The hard part is connecting the two.

I built onchain-attribution-kit as a free, open-source starting point for that gap: UTM-to-wallet capture, Dune SQL templates, and alerts to Telegram, Discord, and Slack.

It is not a SaaS product and it does not claim perfect attribution. It is a practical baseline for growth teams, agencies, and protocol operators who want to stop guessing which campaigns produce real wallet activity.

Happy to answer questions about the architecture or how to adapt it to your protocol.
```

## Required assets checklist

Before launching:

- [ ] Screenshot 1: Static HTML example page with UTM params and wallet connect simulation
- [ ] Screenshot 2: Telegram alert example
- [ ] Screenshot 3: Dune query result showing campaign conversion summary
- [ ] Screenshot 4: events.jsonl showing a stored attribution event
- [ ] GIF or short video: full flow from UTM link to stored event (ideal: 30-60 seconds)
- [ ] Repository has a clean README with Mermaid diagram rendering correctly on GitHub
- [ ] At least one issue template in .github/ISSUE_TEMPLATE/
- [ ] GitHub stars: aim for 10+ before PH launch (soft launch first)
- [ ] Repo is public and licensed MIT

## Launch day checklist

- [ ] Post to X: "I open-sourced the attribution starter kit I wish every Web3 growth team had..."
- [ ] Post on LinkedIn with the GitHub link
- [ ] Share in 2-3 relevant Discord/Telegram communities (where allowed)
- [ ] Reply to every comment on Product Hunt within 2 hours of launch
- [ ] Monitor GitHub issues for first-time user questions

## Timing recommendation

Launch Tuesday to Thursday, early morning US Eastern time (6-9 AM ET).
Avoid Monday (crowded) and Friday (low engagement).
