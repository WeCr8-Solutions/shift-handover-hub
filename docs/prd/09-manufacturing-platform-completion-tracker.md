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
| P0.1 | Runtime | Restore installed frontend dependencies | Declared in `package.json`, missing from active install tree | in_progress | `npm ls qrcode jspdf papaparse --depth=0` | Current tree returned empty for these packages |
| P0.2 | Runtime | Boot Vite without unresolved imports | Local dev server reported unresolved imports | not_started | `npm run dev` | Must verify clean boot after install |
| P0.3 | Runtime | Restore local build path | Not yet re-validated after dependency repair | not_started | `npm run build` | Build must complete cleanly |
| P0.4 | Runtime | Restore Playwright execution path | Current local Playwright execution failed due to local dependency/module issues | blocked | `npx playwright test ...` | Depends on healthy local install |
| P1.1 | Verification | Remove noisy async dashboard test warnings | OperatorStationPanel tests pass with repeated `act(...)` warnings | not_started | targeted `npm test` | Warnings reduce trust in UI timing assertions |
| P1.2 | Verification | Add meaningful smoke tests | Current GCA/OAP E2E mostly route-smoke | not_started | Playwright smoke suite | Must include authenticated and business-flow slices |
| P1.3 | Verification | Add business-flow tests for critical slices | ERP, cert sync, profile portability under-covered | not_started | targeted unit + E2E | Prioritize by operational risk |
| P2.1 | ERP | Complete JobBOSS unified read-through path | `useUnifiedQueue` still documents fallback/skipped behavior | not_started | unit + smoke | SAP stronger than JobBOSS today |
| P2.2 | ERP | Validate native vs read-through vs write-through mode behavior | Partial evidence only | not_started | unit + E2E | Include ITAR-safe read-through assertions |
| P2.3 | ERP | Validate ITAR persistence constraints | Logic exists, not fully proven end-to-end | not_started | edge fn + UI validation | Must prove no write-through leakage |
| P3.1 | Documents | Define first-class manufacturing package model | Only per-step document attachments today | not_started | design review + schema | Need package, revision, approval, completeness rules |
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

1. `P0.1` Restore installed frontend dependencies
2. `P0.2` Boot Vite without unresolved imports
3. `P0.3` Restore local build path
4. `P0.4` Restore Playwright execution path
5. `P1.1` Remove noisy async dashboard test warnings
