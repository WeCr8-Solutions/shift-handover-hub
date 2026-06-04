# 02 — Execution Plan

Eight phases. Phases 1–3 ship in the first 30 days; the rest sequence through the 90-day roadmap.

---

## Phase 1 — Define the campaign

- **Owner:** Editorial
- **Status:** Done (this doc set + landing page)
- **Exit criteria:** Public landing page live at `/manufacturing-100`; methodology page live; nomination form live; backend table accepting submissions.

---

## Phase 2 — Build the nomination funnel

- **Owner:** Product
- **Status:** In build (Phase 1 PR)
- **Exit criteria:** `/manufacturing-100/nominate` collects all required fields, validates client-side, writes to `mfg_100_nominations`, requires consent, and confirms via thank-you state.

Required fields: nominee identity (name, company, role), public links (LinkedIn, website), category, reason, evidence links, nominator name and email, consent checkbox, optional interest flags (JobLine Talent, OAP, GCA, JobLine.ai demo).

---

## Phase 3 — Research and candidate list

- **Owner:** Editorial + research agents
- **Status:** Queued
- **Exit criteria:** Internal Supabase candidate table contains 150–300 vetted candidates with category, evidence links, and provisional score components.

Candidate sources: LinkedIn manufacturing creators, CNC programmers with educational content, machine shop owners, manufacturing educators, automation integrators, tooling and metrology experts, MES software builders, trade-school instructors, regional manufacturing leaders, aerospace/defense voices.

---

## Phase 4 — Score and rank

- **Owner:** Editorial (human review mandatory)
- **Status:** Queued
- **Exit criteria:** Top 100 reviewed by an editor before publish. No published rank derives solely from AI scoring.

Scoring weights (see `03-ranking-methodology.md`):

- 25% practical manufacturing impact
- 20% modernization / innovation
- 20% audience and industry visibility
- 15% education / mentorship / community
- 10% relevance to small and mid-size manufacturing
- 10% momentum over the last 12 months

---

## Phase 5 — Content package

- **Owner:** Marketing
- **Status:** Queued
- **Exit criteria:** Main article, top-100 page, category pages, social announcement, individual badge graphics, nominee outreach emails, winner outreach emails, sponsor/media kit, follow-up think-piece.

---

## Phase 6 — Launch sequence

- **Owner:** Marketing
- **Status:** Queued
- **Exit criteria:** Public launch with measurable lift in nominations, demo requests, Talent signups, and inbound press.

Sequence: teaser → nomination reminders → behind-the-scenes post → final deadline → shortlist teaser → official launch → category tag posts → "who did we miss" discussion → Talent/demo follow-up.

---

## Phase 7 — Lead capture and follow-up

- **Owner:** Sales + Marketing
- **Status:** Queued
- **Exit criteria:** Each lead segment has a defined follow-up path running in the CRM.

Segments: featured people (badge + share kit), nominators, companies represented, shop owners (JobLine.ai demo), operators (Talent invitation), educators (OAP/GCA partnership), vendors (sponsorship).

---

## Phase 8 — Turn it into an annual asset

- **Owner:** Editorial + Sponsorship
- **Status:** Queued (Year 2)
- **Exit criteria:** Year 2 ships with up/down indicators, alumni network, public nomination count, sponsor-backed category awards, virtual award event, downloadable industry report, Manufacturing Visibility Index.
