# JobLine.ai Growth Strategy Playbook — Plan

Create an internal **high-level strategy** library at `docs/marketing/` covering both sides of the marketplace (shops + talent). Vision and positioning focused, not tactical checklists. Pairs with the existing `docs/investors/` directory so fundraising and GTM tell the same story.

## Files to create

```text
docs/marketing/
├── README.md                       Index + how to use these docs + quarterly review cadence
├── 00-positioning.md               Category creation: "Digital Expeditor"; messaging pillars; ICP definition for shops vs talent; differentiation vs Paperless Parts / Tulip / Katana / Fulcrum / Indeed
├── 01-brand-strategy.md            Brand voice (shop-floor credible, anti-buzzword), visual principles, narrative arc, founder-led story angles
├── 02-shop-side-strategy.md        Demand-side GTM: ICP (10–100 employee precision shops, AS9100/ITAR), buyer journey, primary channels (industry associations, regional manufacturing networks, direct outreach, partner-led), trust-building levers
├── 03-talent-side-strategy.md      Supply-side GTM: operator/machinist acquisition, GCA + OAP as credential moat, trade school partnerships, profile virality loops, two-sided flywheel mechanics
├── 04-content-and-seo.md           Content pillars (handbook, GCA topics, manufacturing-100 list, operator tools), SEO posture, llms.txt + AI-search positioning, editorial cadence philosophy
├── 05-partnerships-and-ecosystem.md  ZOLLER, ERP vendors (JobBOSS/SAP), trade associations (NTMA/PMA), workforce/grant programs (MEP, Apprenticeship.gov), VS Code G-Code add-in cross-promotion
├── 06-pr-and-community.md          Press strategy (vertical trade pubs first, mainstream second), conference posture (IMTS, Westec, Top Shops), community-building philosophy, founder visibility
├── 07-product-led-growth.md        Free tiers (Talent profiles, GCA, operator tools) as top-of-funnel, certificate issuance ($12) as monetized loop, shop trial → paid conversion philosophy
├── 08-metrics-and-north-star.md    North star metric candidates (active shifts handed off / week), funnel KPIs per side, leading vs lagging indicators, what NOT to optimize for
└── 09-roadmap-and-sequencing.md    90/180/365-day strategic priorities, sequencing rationale, kill criteria for channels that underperform
```

## Content principles

- **Strategy not tactics**: each doc explains *why* and *what posture* — leaves execution details (email templates, ad copy, posting schedules) out of scope per user choice.
- **Both sides addressed**: shops and talent each get a dedicated strategy doc, plus cross-cutting docs (positioning, brand, partnerships) treat both audiences.
- **Investor-coherent**: positioning, ICP, and moat language stay consistent with `docs/investors/one-pager.md` and `docs/investors/README.md` so fundraising and GTM reinforce each other.
- **No new code, no routes, no UI** — pure internal markdown documentation under `docs/`.
- **Length target**: each file ~150–400 lines, scannable headings, bullet-led.

## Out of scope

- Tactical playbooks (email templates, ad creative, posting calendars, channel-specific SOPs).
- Code, components, routes, or DB changes.
- Public-facing marketing pages.

## Acceptance

- 11 markdown files created under `docs/marketing/`.
- `README.md` indexes the other 10 with one-line summaries and a recommended reading order.
- Positioning/ICP/moat language reconciles with existing `docs/investors/` content.
