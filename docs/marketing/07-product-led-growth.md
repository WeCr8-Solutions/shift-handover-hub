# 07 — Product-Led Growth

## Goal

Get the product itself doing the work of acquisition. Every operator we credential, every tool we ship for free, every public talent profile is a top-of-funnel asset that costs us almost nothing per incremental user.

## PLG philosophy here

- **Free where it builds the moat.** Operator profiles, GCA, OAP, operator tools (speed/feed, thread chart, tap drill, handbook) — all free, all forever.
- **Paid where there is real shop-side value.** Shift handoff, work orders, scheduling, ERP integration, talent search for employers.
- **One small monetized loop that proves the model.** Certificate issuance ($12 one-time) — covers compute + signals seriousness on the operator side.
- **No dark-pattern conversion.** No fake scarcity, no surprise paywalls, no friction-added "downgrade" flows. The trade notices and remembers.

## Free surfaces (top of funnel)

| Surface | Audience | Strategic role |
|---|---|---|
| **Talent profiles** (`/talent/:username`) | Operators | Supply-side wedge; public SEO; identity ownership |
| **GCA** (G-Code Academy) | Operators + students | Credential; trade-school distribution; SEO topic library |
| **OAP** (Operator Acceptance Program) | Operators + mentors | Workforce credential; partner-eligible curriculum |
| **Operator tools** (speed/feed, thread, tap drill) | Operators | Daily-use anchor; repeat visits; SEO |
| **Handbook reference layer** | Operators + students | Authority; AI-answer surface |
| **Measuring tools library** | Operators + mentors | OAP feeder; trade-school adoption |
| **Manufacturing Visibility 100** | Industry | PR + earned attention |
| **Business Card Studio** | Shop owners + operators | Physical-world distribution back into digital |

Each surface should pull the next:
- Operator tool → Handbook page → GCA module → profile signup.
- GCA completion → OAP enrollment → certificate purchase → profile credential badge.
- Talent profile → shop discovers operator → shop signs up for hiring → shop installs shop product.

## Paid surfaces (monetization)

- **Shop subscription tiers** (Single / Team / Enterprise) — covered in subscription memory entries.
- **Concierge service** (Stripe or $1,500 offline) for shops that want activation done for them.
- **Certificate issuance** ($12 Stripe one-time) for operators.
- **Talent hiring access** for shops (tier-gated; not a per-job-post model).
- **Future**: workforce-grant-eligible OAP rollouts to trade-school districts.

## Operator-pulled adoption

The single highest-leverage PLG mechanic we have: **operators inside non-customer shops sign up for the free surfaces, then bring the shop product to their employer.**

Make this easy:
- Profile and credential are 100% usable without an employer attached.
- "I want my shop to use this" CTA is visible (and routes to a low-friction trial request).
- Operators can invite their supervisor / owner directly.
- When an operator's shop signs up, their existing credentials and profile carry in.

## Two-shift trial

Standardize the trial as **"two full shifts of real work."** This frames evaluation around outcomes operators feel, not a 14-day countdown.

Why:
- Aligns with how the buyer (shop owner) thinks about whether something works.
- Operators are the real evaluators; two shifts is enough to tell.
- Eliminates the "I haven't had time to look at it" objection.

Operationally:
- 14-day free trial under the hood (per trial-enforcement memory).
- Activation success measured by shifts handed off, not logins.
- Concierge available for shops that want help configuring before trial starts.

## Activation > acquisition

Acquisition without activation is a leaky bucket. Strategic priorities:

1. **First handoff inside 24 hours** of trial start. Anything slower means the product hasn't entered the floor's daily rhythm.
2. **Lead operator + owner both logged in within 72 hours.** Single-sided activation predicts churn.
3. **ERP connector (if any) live before the second week.** Otherwise the trial is judged on a partial picture.
4. **At least one credentialed operator** in the shop before end of trial. Demonstrates the talent-side value.

If activation milestones miss, escalate to concierge — don't extend the trial silently.

## Referral loops

Two natural ones, both already partially in the product:

1. **Operator → operator** (talent side). Credentialed operator shares profile URL; another operator signs up.
2. **Shop → shop** (demand side). Owner invites peer to view a public artifact (case-study microsite, anonymized state-of-the-floor stats from their org).

We do **not** pay per-referral cash bounties. They distort signal in this trade and create misaligned incentives. We do credit referrers with:
- Free seats / months for shop referrals.
- Featured placement / Manufacturing Visibility 100 consideration for operator referrals at volume.
- Public acknowledgment where the referrer wants it.

## Expansion within a customer

The same PLG logic applies inside paying shops:

- **Station → station.** Land on one station, expand across the floor.
- **Site → site.** Multi-site shops adopt one site first; the second site is sold by the first site.
- **Module → module.** Land on handoff, expand to OAP, then talent hiring, then ERP coexistence.

Expansion is more profitable than new logos. Make it the easiest path in the product.

## What PLG cannot do here

- It cannot replace founder-led shop sales in year 1–2. The buyer doesn't self-serve enterprise on this product.
- It cannot replace partnerships (doc 05). The trust hurdle is too high to pure-PLG through.
- It cannot replace credential rigor. A weak credential is worse than no credential — the loop only works if the credential means something.

## Anti-patterns to avoid

- **Charging operators.** Beyond the optional $12 certificate, never. Operators paying is supply-side suicide.
- **"Freemium" shop tier that's nearly useless.** Better to have no free shop tier than a crippled one that anchors low.
- **Cross-sell pop-ups inside the shop product.** Operators will close the tab.
- **Email-only "PLG" with no in-product loop.** That's not PLG. That's marketing automation.
