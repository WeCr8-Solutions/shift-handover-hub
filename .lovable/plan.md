# JobLine.ai Platform Audit & Competitive Roadmap

## Deliverable

A set of Markdown files under `.lovable/audits/2026-06-mes-erp/`, all codebase-grounded with `file:line` citations for every "current state" claim. No app code changes, no UI, no DB writes.

```text
.lovable/audits/2026-06-mes-erp/
  00-executive-summary.md          ← read-this-first, 2-3 pages
  01-work-order-management.md      ← Audit Category 1
  02-shop-floor-execution.md       ← Audit Category 2
  03-department-audits.md          ← Audit Category 3 (all 13 personas)
  04-competitive-matrix.md         ← Audit Category 4 (feature × competitor table)
  05-intelligence-roadmap.md       ← Audit Category 5 (AI / integrations)
  06-executive-review.md           ← Audit Category 6 (Q&A + top 25 gaps + top 10 differentiators)
  07-roadmap-30-90-365.md          ← Balanced action lists per horizon
  appendix-a-file-index.md         ← Master file:line citation index
  appendix-b-data-model-map.md     ← Which of the 180+ tables back which capability
```

## Method

### Phase 1 — Inventory (read-only, ~40 min)

1. Walk `src/pages/`, `src/components/`, `src/hooks/`, `supabase/functions/`, `supabase/migrations/` to map current surfaces.
2. Cross-reference the 180+ tables in `supabase-tables` against UI surfaces — flag tables with no UI (latent capability) and UI screens with weak data (façade risk).
3. Pull every memory under `mem://features/*` and `mem://technical/*` to avoid mis-claiming gaps for features that already exist.
4. Read each persona's primary entry points:
   - Operator: `src/pages/OperatorStation*`, handoff flow, `useHandoffRecords`
   - Supervisor: `SupervisorDashboard`, `ProductionAnalytics`, queue management
   - Engineer/Programmer: routing templates, setup_sheets, machine_manuals, VS Code extension
   - Quality: `ncr_reports`, `quality_inspections`, `dimension_check_requests`, `routing_step_dimensions`
   - Maintenance: `equipment`, `maintenance_records`, `downtime_events`
   - Purchasing: `material_lots`, `delivery_requests`, outside processing
   - Planning: `queue_items`, capacity planning, AI Planning Assistant
   - HR/Talent: OAP, GCA, `operator_profiles`, certifications
   - Executive: KPI dashboards, `org_health_snapshots`, `erp_usage_metering`
5. Inventory existing ERP/MES integration surface: `erp_connections`, JobBOSS + SAP connectors, MTConnect/OPC-UA status (memory says machine_monitoring exists via WebSocket relay — verify scope).

### Phase 2 — Persona Audits (~90 min)

For each of the 13 personas listed in the request, produce a section with:
- **Today** — what exists, with `file:line` and table citations
- **Friction** — concrete UX/data gaps (not vague "needs polish")
- **Missing** — capabilities a comparable MES has
- **Quick wins** — < 1 sprint
- **Strategic** — > 1 quarter

### Phase 3 — Audit Categories 1 & 2 (Work Order + Shop Floor Execution, ~45 min)

Single tables-per-capability format covering creation → release → revision → routing → labor → setup → downtime → scrap → rework → completion → traveler replacement. Score each: Excels / Adequate / Incomplete / Missing.

### Phase 4 — Competitive Matrix (~60 min)

One large table: rows = ~60 capabilities (work orders, routing, scheduling, MRP, finite capacity, OEE, FAI, NCR/CAR, SPC, tool life, PM, MTConnect, OPC-UA, traceability, EDI, costing, GL, AP/AR, etc.); columns = JobLine + Epicor MES + SAP S/4 Mfg + Plex + Oracle Mfg Cloud + Infor CloudSuite + NetSuite Mfg. Cells = ✓ / Partial / ✗ + 1-line note. Competitor data from public docs and general knowledge — clearly marked as such, not codebase-grounded.

For every "Partial" or "✗" on JobLine: a Recommended Solution row with Priority (Critical/High/Medium/Low) + Effort (S/M/L/XL).

### Phase 5 — Intelligence Roadmap (~30 min)

Status table for: AI scheduling (✓ Planning Assistant exists), predictive maintenance, ML recommendations, workforce skill tracking (✓ OAP/GCA), Talent integration (✓), Tooling Hero (gap), MTConnect (verify), OPC-UA (verify), JobBOSS (✓), Epicor (gap), SAP (✓ scaffold per memory).

### Phase 6 — Executive Review + Roadmap (~30 min)

- Why-buy answers for 20 / 100 / 500 person shops
- Unique advantages vs MES
- "Never copy from ERP" anti-features
- Enterprise-sales gates
- **Top 25 missing features** ranked
- **Top 10 differentiators** that make JobLine category-defining
- **30-day actions**: bug-fix-class items, gaps near completion
- **90-day actions**: feature-class items unlocking mid-market deals
- **12-month strategic roadmap**: positioning shifts, integrations, enterprise-readiness gates

## Scope & Guardrails

- **Read-only**: no migrations, no edits, no edge function changes.
- **Codebase-grounded**: every JobLine "current state" claim cites `src/...` or table/migration. Competitor claims cite "public docs / general knowledge" — never invented features.
- **No live DB queries** (per your "codebase-grounded" choice, not "codebase + live data").
- **Personas covered exactly as requested** — all 13.
- **Competitors covered exactly as requested** — all 6.
- **Length budget**: ~25-40 KB per file, ~250 KB total. Skim-friendly with tables and bullets, not prose walls.

## What this audit will NOT do

- Will not estimate revenue or pricing strategy (out of scope).
- Will not write any production code (plan mode → would be a separate build session).
- Will not benchmark performance or load (no live data sample chosen).
- Will not redesign UI (no design directions in scope).

## After approval

I'll execute Phases 1-6 in order in a single build session and report back with the file tree + a one-paragraph summary of headline findings. You can then queue follow-up build sessions against specific 30-day actions.
