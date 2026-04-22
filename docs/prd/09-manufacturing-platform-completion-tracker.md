# JobLine AI — Manufacturing Platform Completion Tracker

**Date:** 2026-04-21  
**Status:** Active tracker for the remediation plan in `docs/prd/09-manufacturing-platform-remediation-prd.md`

---

## 1. Status Legend

- `not_started` — not yet executed
- `in_progress` — active work underway
- `blocked` — cannot continue until prerequisite is resolved
- `validated` — implementation and executable validation completed

---

## 2. Master Tracker

| ID | Phase | Need | Current state | Status | Validation required | Evidence / notes |
|---|---|---|---|---|---|---|
| P0.1 | Runtime | Restore installed frontend dependencies | Declared dependencies now present in active install tree | validated | `npm ls qrcode jspdf papaparse --depth=0` | Runtime dependency recovery completed during Phase 0 |
| P0.2 | Runtime | Boot Vite without unresolved imports | Local app now boots from repaired install | validated | `npm run dev` | Dev and preview paths recovered during runtime repair |
| P0.3 | Runtime | Restore local build path | Production build and prerender are green on Windows | validated | `npm run build` | Validated repeatedly after prerender fixes |
| P0.4 | Runtime | Restore Playwright execution path | Smoke execution path restored | validated | `npx playwright test ...` | Combined GCA/OAP smoke green after OAP spec repair |
| P1.1 | Verification | Remove noisy async dashboard test warnings | OperatorStationPanel tests no longer emit `act(...)` warnings | validated | targeted `npm test` | `npx vitest run src/components/dashboard/OperatorStationPanel.test.tsx` passes cleanly except unrelated React Router future warnings |
| P1.2 | Verification | Add meaningful smoke tests | Current GCA/OAP E2E mostly route-smoke | not_started | Playwright smoke suite | Must include authenticated and business-flow slices |
| P1.3 | Verification | Add business-flow tests for critical slices | ERP, cert sync, profile portability under-covered | not_started | targeted unit + E2E | Prioritize by operational risk |
| P2.1 | ERP | Complete JobBOSS unified read-through path | `useUnifiedQueue` now consumes live JobBOSS read-only ERP rows | validated | unit + smoke | `erp-sync` read_only path enabled; `npx vitest run src/hooks/useUnifiedQueue.test.ts` passes |
| P2.2 | ERP | Validate native vs read-through vs write-through mode behavior | Partial evidence only | not_started | unit + E2E | Include ITAR-safe read-through assertions |
| P2.3 | ERP | Validate ITAR persistence constraints | Logic exists, not fully proven end-to-end | not_started | edge fn + UI validation | Must prove no write-through leakage |
| P3.1 | Documents | Define first-class manufacturing package model | Design baseline, additive schema, and readiness rules are now in place | validated | design review + schema | `docs/prd/10-manufacturing-package-model.md` added; migration `20260422030000_manufacturing_document_packages.sql` created; `npx vitest run src/lib/manufacturingPackage.test.ts` passes |
| P3.2 | Documents | Implement grouped multi-document package behavior | Flat setup-sheet list only | not_started | UI + schema tests | Must support drawing, setup, instruction, inspection docs |
| P3.3 | Documents | Surface package completeness in execution views | Missing today | not_started | routing/queue validation | Needed for production control |
| P4.1 | GCA | Ship in-app lesson reader | Checklist still marks incomplete | not_started | unit + E2E | Static site should no longer be sole player |
| P4.2 | GCA | Ship in-app test player | Checklist still marks incomplete | not_started | unit + E2E | Must persist attempts |
| P4.3 | GCA | Surface progress dashboard | Data exists, UI incomplete | not_started | UI validation | Needed for credential credibility |
| P4.4 | GCA | Complete profile linkage/public credential path | Partial today | not_started | profile sync tests | Align with talent-network goal |
| P5.1 | OAP | Complete authored section content | Framework exists, content incomplete | not_started | content + E2E | Must cover sections 1-7 in production depth |
| P5.2 | OAP | Validate mentor/employer walkthrough flows | Mechanics exist, full proof thin | not_started | E2E | Include certification issue path |
| P6.1 | Talent | Validate cert issue to profile sync | Code exists, limited flow proof | not_started | integration test | OAP and GCA both required |
| P6.2 | Talent | Validate employer search and public profile rules | Partial confidence | not_started | E2E | Must respect visibility model |
| P6.3 | Talent | Validate portability / transfer workflow | Model exists, limited flow proof | not_started | integration + E2E | Required for portable credential promise |
| P7.1 | AI | Validate routing proposal extraction behavior | Feature exists, limited deterministic proof | not_started | unit tests | Must be safe and consistent |
| P7.2 | AI | Validate source-aware planning behavior | Partial confidence | not_started | prompt fixtures + smoke | Must respect ERP/native/document context |

---

## 3. Completion Checklist

For each tracker row, completion requires:

- Implementation finished
- Validation command executed successfully
- Evidence added to this tracker
- Any downstream blockers updated

---

## 4. Active Focus

Current active execution order:

1. `P3.2` Implement grouped multi-document package behavior
2. `P3.3` Surface package completeness in execution views
3. `P1.2` Add meaningful smoke tests
4. `P2.2` Validate native vs read-through vs write-through mode behavior
5. `P2.3` Validate ITAR persistence constraints
