# 03 — Talent-Side Strategy (Supply)

## Goal

Build a credentialed, public roster of US machine-shop operators large enough that **(a)** shops can't ignore the hiring side and **(b)** operators routinely ask their employer to adopt JobLine.

Supply is a moat. Once it exists, it's hard to copy.

## ICP recap

Active CNC machinists, setup operators, programmers, QC inspectors. 2–20 years experience. Mobile-first. Skeptical of corporate platforms. See `00-positioning.md`.

Secondary: trade-school students and recent grads.

## Why operators show up (and why most platforms fail them)

Operators have been pitched LinkedIn, Indeed, ZipRecruiter, and assorted "manufacturing job boards" for two decades. They mostly ignore them because:

- The platforms reduce them to a resume keyword.
- The platforms can't tell a Swiss-turn operator from an assembler.
- Recruiters spam them with irrelevant jobs.
- There's no way to show what they actually know.

We win by being the opposite of that:

- **Credentials, not keywords.** GCA and OAP make skill objective and verifiable.
- **Operators own the profile.** Privacy tiers (private / employers_only / public) are operator-controlled. Contact info is never public.
- **Outreach is gated and respectful.** Shops can't blast operators; replies require acceptance.
- **It's free, forever, for operators.** No premium tier. No upsell. The shop pays.

## Three reasons an operator joins

1. **Get a credential the trade recognizes.** GCA / OAP / certificate issuance ($12).
2. **Have a portfolio.** Setups, parts (where allowed), tools owned, machines run. Something to point at.
3. **Get found by better shops without spam.** Opt-in visibility, no resume hawking.

Every talent-side surface should pre-answer all three in the first scroll.

## Channel posture (in priority order)

### Tier 1 — Where operators already are

- **Trade schools and apprenticeship programs.** Free curriculum access (GCA), instructor accounts, capstone credentials. Trade schools have a chronic placement problem; we help with both teaching and outcomes.
- **Manufacturing-extension partners and workforce boards.** MEP centers, Apprenticeship.gov programs, state workforce grants. Many of these have budget specifically for credentialing infrastructure.
- **Inside our own shops.** Every paying shop = 10–100 operators who get accounts. Activation in shop is the biggest single supply-side channel and it costs us nothing incremental.

### Tier 2 — Operator-native communities

- **YouTube machining creators.** Titans of CNC, NYC CNC, Edge Precision, Joe Pieczynski, and a long tail of working-machinist channels. Sponsorships only when the creator actually uses the product; product placement reads as fake to this audience.
- **Reddit + Practical Machinist.** r/Machinists, r/CNC, the Practical Machinist forums. Show up as a human, not a brand. Founder-led only.
- **Instagram / TikTok shop creators.** Short clips of setups, parts, tooling. Grows slowly but durably.
- **In-shop posters and business cards.** Yes, physical. The Business Card Studio and Flyer Campaign system exist for this. Operators take a card home and sign up that night.

### Tier 3 — Earned and editorial

- **Trade press operator profiles.** Pitch trade pubs on "operator of the month" style content sourced from our talent roster.
- **The Manufacturing Visibility 100 list.** Editorial product that draws inbound attention to operators we feature.
- **Operator-authored content.** Pay operators to write about setups, tooling, workholding. It seeds SEO (doc 04) and gives them a portfolio piece.

### Tier 4 — Avoid

- **Recruiting-style outbound.** We are not a staffing agency. Acting like one poisons the well.
- **"Sign up for jobs" promo language.** Operators have seen this pitch 100 times. Lead with credential and ownership instead.
- **Paid social to cold operator audiences.** Targeting is poor and the audience is suspicious of ads.

## The two-sided flywheel

```text
   More credentialed operators
            │
            ▼
   Shops can hire better
            │
            ▼
   Shops pay and adopt the floor product
            │
            ▼
   Their operators get accounts and credentials
            │
            ▼
   More credentialed operators  ← back to top
```

Strategic priorities for keeping the flywheel spinning:

- **Default every shop seat to a real operator profile.** Not a service account.
- **Make GCA + OAP free and excellent.** Anything less and the credential is worthless.
- **Make profile portability obvious.** "Take it with you when you change jobs" is the unlock.
- **Surface credentialed operators back to shops** in hiring search the moment supply density allows.

## Credential moat — why GCA + OAP matter

The trade has **no recognized digital credential**. NIMS exists but is heavyweight and not widely adopted. AS9100 is a shop credential, not a personal one. We have an opening to define the de facto operator credential, the way AWS Certified Solutions Architect became table stakes in cloud.

Strategic posture:
- **Rigor first, marketing second.** A credential is only valuable if it's hard to fake. Mentor sign-off (OAP), proctored attempts (GCA), and printable evidence packets are non-negotiable.
- **Make it portable.** Credentials live with the operator, not the shop. The certificate verifies at `/verify/:certId` for life.
- **Recognized by partners.** Push for trade-association and trade-school endorsement over time. Even soft endorsement compounds.

## Privacy as a feature (not a compliance checkbox)

Operators have been burned by data exposure. Lean into the privacy story publicly:

- Three-tier visibility (private / employers_only / public), operator-controlled.
- Personal email, phone, address never public — confirmed in the talent contact-privacy memory.
- All outreach routes through in-app messaging, accept-gated.
- Public talent pages serve via SECURITY DEFINER RPCs — no service-key exposure.

This is also a recruiting moat: every time a recruiter spams an operator on LinkedIn, we should be the alternative they switch to.

## Trip-wires

- If operator sign-ups outpace shop activations 50:1 for two consecutive quarters, the supply side is over-running the demand side and we need to convert before adding more operators.
- If credential completion rates drop below 30% of starters, the credentials are too long, too hard, or too unclear — fix before scaling marketing.
- If operator privacy-tier defaults shift more public than they should, something in onboarding is dark-patterning and must be corrected immediately. Brand debt rule (doc 01).
