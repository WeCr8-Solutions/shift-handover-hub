# 08 — Metrics & North Star

## Goal

Optimize for the smallest number of things that, if they grow, drag the rest of the business with them. Avoid the trap of dashboarding everything and prioritizing nothing.

## North star metric (candidate)

**Weekly Active Handoffs (WAH)** — the count of shift handoffs successfully completed across all paying shops in a given week.

Why this metric:

- **It captures real product use**, not vanity (logins, MAU, signups).
- **It correlates directly with the value proposition.** If WAH grows, the digital expeditor is being used. If it doesn't, nothing else matters.
- **It's hard to game internally.** A fake login is easy; a fake completed handoff with quantity accounting isn't.
- **It compounds across both sides.** More shops → more handoffs. More credentialed operators → better handoffs → retention → more handoffs.

Secondary north star (talent side): **Credentialed Active Operators (CAO)** — operators with at least one earned GCA bank pass or OAP completion in the last 90 days. Tracks supply-side moat health.

## Funnel KPIs

### Shop side

| Stage | KPI | Healthy range (year 1) |
|---|---|---|
| Awareness | Unique in-ICP site sessions / month | Growing month-over-month |
| Consideration | Founder-conversations booked / month | 20+ |
| Trial | Two-shift trials started | 10+ / month |
| Activation | First handoff completed inside 24h | ≥ 70% of trials |
| Conversion | Trial → paid | ≥ 40% |
| Retention | Logo retention at month 6 | ≥ 90% |
| Expansion | Net revenue retention | ≥ 110% |

### Talent side

| Stage | KPI | Healthy range (year 1) |
|---|---|---|
| Awareness | Talent landing-page sessions / month | Growing month-over-month |
| Signup | Operator profiles created / month | 200+ |
| Activation | Profile reaches ≥ 60% complete inside 7d | ≥ 50% |
| Credential | First credential earned inside 30d | ≥ 30% |
| Engagement | 30-day return rate | ≥ 25% |
| Conversion (to shop side) | Operator-pulled trial requests | track; rising is the signal |

## Leading vs lagging indicators

### Leading (move first; act on)

- **Founder conversations booked** (shop side)
- **GCA module starts** (talent side)
- **Trade-press citations** (brand)
- **Partner-introduced shops** (channel mix)
- **Activation milestones hit during trial** (retention predictor)
- **Operator-pulled trial requests** (flywheel health)

### Lagging (confirm strategy worked; don't optimize directly)

- ARR / MRR
- Logo count
- Churn
- AI-answer-engine citations sampled monthly
- Press mentions per quarter

If lagging metrics move without leading metrics moving, the gain is likely noise and won't repeat.

## What we deliberately do NOT optimize for

- **Total signups** that aren't in-ICP. They look great in a deck and convert to nothing.
- **MAU on free operator tools** as a headline. It's a means, not an end.
- **Pageviews and bounce rate.** Useful diagnostically; misleading as targets.
- **Social media followers** on platforms where buyers don't live.
- **CAC payback on cold paid acquisition** — we shouldn't be running enough of it for this to matter at this stage.
- **NPS as a primary metric.** Useful in a footnote; gamed when it's a target.

## Cohort discipline

- All retention and expansion metrics are read **by signup cohort**, not in aggregate. Aggregate hides the trend you need to see.
- Cohorts compared at the same age (M+0, M+3, M+6, M+12), not against today.
- A new cohort underperforming the prior cohort at the same age is the earliest serious warning we get. Treat it as a fire drill.

## Attribution posture

- **Self-reported first-touch attribution** is more useful than multi-touch model attribution at our stage. Ask the shop owner during onboarding: "How did you first hear about us?" Log it.
- **One field, one source of truth.** Don't run three competing attribution stacks.
- **Honor the imprecision.** Attribution is directional, not surgical. Use it to allocate effort, not to fire vendors.

## Reporting cadence

| Cadence | Audience | Surface |
|---|---|---|
| Weekly | Founder + ops | WAH, trials started, conversations booked, activation hits |
| Monthly | Whole team | Funnel KPIs (shop + talent), top 3 wins, top 3 misses |
| Quarterly | Whole team + advisors | Cohort health, channel mix, strategy review against this library |
| Annually | Investors + advisors | State-of-the-Floor public report; private cohort cohort retention by year |

## When the numbers say "rethink"

Strategy trip-wires (also referenced in their respective docs):

- WAH flat for 8+ consecutive weeks while logo count is growing → activation problem, not acquisition.
- Talent sign-ups outrun shop activations 50:1 for two quarters → over-supply; convert before adding more.
- Trial → paid drops below 40% → activation flow broken; freeze new acquisition spend until fixed.
- Month-6+ churn above 5% monthly → product debt; fix before fundraising bigger.
- Cohort-on-cohort retention degrading 3 cohorts in a row → strategic problem; quarterly review must address.

The point of metrics is to make us change behavior. If we never change behavior in response to a number, we don't actually need the number.
