# JobLine.ai — Investor Materials

Internal directory for fundraising materials, outreach lists, and email templates.
**Confidential — do not commit to public branches without review.**

## Contents

| File | Purpose |
|---|---|
| `01_Investor_Presentation.pdf` | Master seed deck (17 slides, v1 — June 2026) |
| `one-pager.md` | 1-page executive summary, paste into email body or export to PDF |
| `target-investors.md` | Researched target list: vertical SaaS / manufacturing / industrial-tech funds + angels |
| `outreach/cold-intro.md` | Cold intro email — generic VC/angel |
| `outreach/warm-intro-request.md` | Ask a mutual contact for a warm intro |
| `outreach/manufacturing-vertical.md` | Tailored for industrial / hard-tech investors |
| `outreach/workforce-edtech.md` | Tailored for workforce / CTE / edtech investors (GCA + OAP angle) |
| `outreach/strategic-angel.md` | Operator angels (ex-manufacturing execs, ZOLLER network, etc.) |
| `outreach/follow-up.md` | 7-day and 14-day follow-up sequence |
| `outreach/post-meeting.md` | Post-pitch recap + next-step ask |

## The Ask (at-a-glance)

- **Round:** Seed — $150K to $300K
- **Instrument:** SAFE, $2M valuation cap, no discount (YC standard)
- **Use of funds:** 50% engineering, 30% GTM/customer success, 20% workforce/grants infrastructure
- **Milestone:** Pre-revenue → ~$100K MRR by Q4 2026
- **Anchor customer:** Aymar Engineering (Santee, CA)
- **Founder:** Zach Goodbody — 20+ yrs CNC (GKN Aerospace, General Atomics, Tri-Mas), ZOLLER Toolroom of the Year 2026 judge

## Recommended workflow

1. **Pick 10–15 targets** from `target-investors.md` for week 1.
2. **Personalize** the matching template (`outreach/*.md`) — never send raw boilerplate; reference a portfolio company or thesis line.
3. **Track in a sheet** (or Notion / Airtable): name, fund, date sent, reply, status, next action.
4. **Follow up at day 7 and day 14** using `outreach/follow-up.md`. After two no-replies, move on.
5. **Log every meeting** under `meetings/YYYY-MM-DD-firm.md` (gitignored if you prefer — see note below) with: who attended, questions asked, objections, follow-up commitments.

## Privacy note

This directory is checked in for convenience. If you want investor names, meeting notes, or financials kept off git, add:

```
docs/investors/meetings/
docs/investors/private/
```

to `.gitignore` and store sensitive items there.

## Version log

- **2026-06-12 — v1** — Initial directory, deck v1, 30-target list, 6 email templates.
