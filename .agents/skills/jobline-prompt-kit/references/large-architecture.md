# Large architecture & user-benefit prompts

Repo-wide reasoning. Temperature 0.3. Attach: SKILL.md guardrails + `.lovable/prd/00-index.md` + relevant mermaid files (`data__erd`, `data__rls_matrix`, `fe__sitemap`, `be__api_map`).

---

## 1. System orientation (one-shot LLM onboarding)

```
You are onboarding to JobLine.ai — a digital expeditor + shift handoff platform for AS9100/ITAR CNC shops, with adjacent Talent Network, OAP (Operator Acceptance Program — operator cert), GCA (G-Code Academy), and ERP connectors (JobBOSS, SAP).

Inputs attached: PRD index, mermaid sitemap, ERD, RLS matrix, role hierarchy.

Produce:
1. One-page mental model: personas → modules → data → money
2. The 6 "hot" invariants you must never violate (RLS org scoping, ITAR read_through, canonical data NULL org, transfer-token single-use, billing role isolation, public talent contact privacy)
3. Top 10 files a new contributor must read, ranked, with one-line rationale
4. 5 questions to ask product before touching code
```

---

## 2. User-benefit audit — manufacturing side

```
For each core manufacturing module (Work Orders/Queue, Routing, Handoff, NCR, Station Dashboard, ERP Connector, AI Planning Assistant), evaluate:
- Concrete operator / supervisor / admin benefit in <1 sentence
- Friction points visible in code (clicks-to-value, missing affordances, blocking modals, opaque error states)
- Whether ITAR/AS9100 compliance is *enabling* the workflow or *taxing* it
- One highest-leverage improvement, sized S/M/L, with files to touch

Return as a table, then a prioritized backlog of 10 items with effort + expected user impact.
```

---

## 3. User-benefit audit — talent side

```
For Talent Network (/talent, /talent/:username, OAP certs, GCA, messaging, employer search):
- Map the operator's journey from anonymous → profile → cert → discovered by employer → hired
- Identify dead ends (cross-ref docs/mermaid/audit/fe_dead_ends.md), privacy leaks, and any contact-privacy violations
- Score each step 1–5 on clarity, trust, and conversion likelihood
- Propose 5 incremental UX wins that don't require new tables or new edge functions

Return: journey map + scorecard + ranked wins with file:line citations.
```

---

## 4. Cross-module coherence trace

```
Trace one work order from creation → routing → station execution → handoff → completion → NCR (if any) → ERP write-back → operator OAP credit.

Identify:
- Every place state can desync (client cache vs DB vs ERP)
- Every RLS boundary crossed and how it's enforced
- Every realtime/polling fallback (per technical/sync/real-time-polling)
- Where ITAR read_through diverges from native write paths

Output: a sequence diagram (mermaid) + a list of fragility points ranked by blast radius.
```

---

## 5. "Does it actually help users?" gut check

```
Given the PRDs and mermaid journeys, answer bluntly:
- What problem does a CNC shop owner pay us to solve, and where in the code is that value delivered?
- What would a talent-side operator brag about to a peer after 1 week?
- What's the single feature whose removal would most hurt retention?
- Which surfaces look like façades (UI present, data thin) per .lovable/audits/2026-06-mes-erp/appendix-b §B.3?

Cite files. Flag anything that smells like a demo prop.
```

---

## 6. Security / compliance posture review

```
Review the project's overall security posture against the invariants block. For each of:
- RLS coverage (any user-writable public table without RLS?)
- SECURITY DEFINER hygiene (search_path set?)
- ITAR read_through enforcement (trigger present, no bypass paths?)
- Edge function auth (verify_jwt + has_role)
- Secret handling (no VITE_ exposure of service-role or LOVABLE_API_KEY)
- Talent contact privacy (no public surface returns email/phone)
- Billing role isolation (Stripe data via organization_billing only)

Output: pass/fail table + the 5 highest-priority error-level fixes with file/line/SQL.
```

---

## 7. Performance & UX budget audit

```
Audit dashboard and station-operator routes against:
- LCP, TTI, route-level code splitting
- Realtime subscription count per page
- N+1 Supabase queries (look for queries inside .map/.forEach)
- Reorder/queue operations using atomic RPC (reorder_queue_item) vs client loop
- Mobile (<400px) usability — useIsMobile gating, touch target size

Return: top 10 wins ranked by (impact ÷ effort), with file refs.
```

---

## 8. Feature-to-PRD reconciliation

```
For PRDs listed in .lovable/prd/00-index.md, identify:
- PRDs whose implementation diverges from the spec
- Implemented features with no PRD coverage
- PRD sections marked Active that are actually Draft in code

Output: 3 tables. No code changes — this is a documentation truth-up.
```
