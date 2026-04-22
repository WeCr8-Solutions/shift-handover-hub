# JobLine AI — Manufacturing Platform Completion Tracker

**Date:** 2026-04-22  
**Status:** Active tracker for the remediation plan in `docs/prd/09-manufacturing-platform-remediation-prd.md`; reviewed against implementation on 2026-04-22

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
| P1.2 | Verification | Add meaningful smoke tests | Public route smoke now covers GCA, OAP, talent, cert verification, and first-party status/health surfaces; authenticated business-flow depth still remains for P1.3 | validated | Playwright smoke suite | `E2E_BASE_URL=http://127.0.0.1:4174 npx playwright test e2e/gca.spec.ts e2e/oap.spec.ts e2e/status.spec.ts --project=chromium` passes |
| P1.3 | Verification | Add business-flow tests for critical slices | ERP read-through business surfaces now have focused coverage at the persistence gate, unified queue mode hook, supervisor-facing dashboard banner, certificate-to-public-profile linkage, OAP transcript portability UI, public talent-profile visibility rules, and employer-facing browse filters; issued-cert-to-transcript sync remains the clearest under-covered slice | in_progress | targeted unit + E2E | `npx vitest run src/test/erpPersistence.test.ts`, `npx vitest run src/hooks/useUnifiedQueue.test.ts`, `npx vitest run src/components/dashboard/DataSourceBanner.test.tsx`, `npx vitest run src/lib/certificates.test.ts src/components/certificates/CertificateTemplate.test.tsx`, `npx vitest run src/pages/OapMyTranscript.test.tsx`, `npx vitest run src/pages/PublicOperatorProfile.test.tsx`, and `npx vitest run src/pages/TalentBrowse.test.tsx` pass |
| P2.1 | ERP | Complete JobBOSS unified read-through path | `useUnifiedQueue` now consumes live JobBOSS read-only ERP rows | validated | unit + smoke | `erp-sync` read_only path enabled; `npx vitest run src/hooks/useUnifiedQueue.test.ts` passes |
| P2.2 | ERP | Validate native vs read-through vs write-through mode behavior | Unified queue behavior is now proven for native/write-through, JobBOSS read-through, and SAP read-through modes | validated | unit + E2E | `npx vitest run src/hooks/useUnifiedQueue.test.ts` passes with mode coverage for queue_items, `erp-sync`, and `sap-sync` |
| P2.3 | ERP | Validate ITAR persistence constraints | Read-through persistence blocking is now isolated in shared ERP gate logic with explicit tests proving no queue write-through path for ITAR/read-through mode, while read-only fetch remains allowed | validated | edge fn + UI validation | `npx vitest run src/test/erpPersistence.test.ts` passes; read-through UI consumption remains covered by `npx vitest run src/hooks/useUnifiedQueue.test.ts` |
| P3.1 | Documents | Define first-class manufacturing package model | Design baseline, additive schema, and readiness rules are now in place | validated | design review + schema | `docs/prd/10-manufacturing-package-model.md` added; migration `20260422030000_manufacturing_document_packages.sql` created; `npx vitest run src/lib/manufacturingPackage.test.ts` passes |
| P3.2 | Documents | Implement grouped multi-document package behavior | Setup sheets are now grouped into package-style sections by document type and revision in execution views | validated | UI + schema tests | `src/lib/setupSheetPackages.ts` and `src/components/queue/SetupSheetsPanel.tsx` added; `npx vitest run src/lib/setupSheetPackages.test.ts` passes |
| P3.3 | Documents | Surface package completeness in execution views | Legacy setup-sheet readiness is now surfaced in routing execution with a focused queue test proving incomplete package warnings on expanded steps | validated | routing/queue validation | `npx vitest run src/components/queue/QueueItemRoutingTab.test.tsx` passes; `src/lib/legacyPackageReadiness.test.ts` remains green for readiness rules |
| P4.1 | GCA | Ship in-app lesson reader | Checklist still marks incomplete; static academy remains the primary lesson surface | not_started | unit + E2E | `docs/gca-implementation-checklist.md` still says the static site is the only lesson player; no in-app lesson reader has replaced `public/gcode-academy` |
| P4.2 | GCA | Ship in-app test player | Routed in-app test page and player now exist, but tracker scope is not complete until seeded persistence and broader flow validation land | in_progress | unit + E2E | `src/pages/GcaTestPage.tsx` renders `src/components/gca/GcaTestPlayer.tsx`; attempts persist to `gca_test_attempts`, but coverage is still route-smoke rather than full learning flow |
| P4.3 | GCA | Surface progress dashboard | Data exists, UI incomplete | not_started | UI validation | Needed for credential credibility |
| P4.4 | GCA | Complete profile linkage/public credential path | Partial today | not_started | profile sync tests | Align with talent-network goal |
| P5.1 | OAP | Complete authored section content | Framework exists, content incomplete | not_started | content + E2E | Must cover sections 1-7 in production depth |
| P5.2 | OAP | Validate mentor/employer walkthrough flows | Transcript portability UI and transfer-code generation now have focused page-level proof, but mentor/employer walkthrough and certification issue flows still need broader scenario coverage | in_progress | E2E | `npx vitest run src/pages/OapMyTranscript.test.tsx` covers transcript and portability controls; next step is seeded mentor/employer path validation |
| P6.1 | Talent | Validate cert issue to profile sync | Public certificate verification, certificate-template profile linkage, and transcript rendering/portability controls are now covered, but issued-cert to transcript sync still lacks end-to-end proof | in_progress | integration test | `src/lib/certificates.test.ts`, `src/components/certificates/CertificateTemplate.test.tsx`, and `src/pages/OapMyTranscript.test.tsx` cover verify/profile linkage plus transcript display; next step is transcript-backed issuance flow |
| P6.2 | Talent | Validate employer search and public profile rules | Public talent profile now has focused proof for private/not-found behavior and verified-only credential visibility, and employer-facing browse filters are now proven to pass verified/open-to-work criteria into the public search RPC and render the filtered result badges correctly | validated | focused page-level validation | `npx vitest run src/pages/PublicOperatorProfile.test.tsx` and `npx vitest run src/pages/TalentBrowse.test.tsx` pass |
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

1. `P1.3` Add business-flow tests for critical slices
2. `P4.1` Ship in-app lesson reader
3. `P4.2` Ship in-app test player
4. `P4.3` Surface progress dashboard
5. `P4.4` Complete profile linkage/public credential path

---

## 5. Immediate Next-Phase Execution Order

These items are the highest-confidence incomplete slices after the 2026-04-22 implementation review.

1. `P4.1` Build the in-app GCA lesson reader.
	Scope: replace the static academy as the only lesson player by introducing a routed reader that can render curriculum, markdown, and embedded references inside the app shell.
	Primary files: `docs/gca-implementation-checklist.md`, `src/pages/GCALanding.tsx`, `src/pages/GcaTestPage.tsx`, `public/gcode-academy/src/gca-curriculum.js`.
	Validation target: targeted component test plus Playwright flow from `/gcode-academy` into an in-app lesson page.

2. `P4.3` Surface GCA progress in-app before broadening credential claims.
	Scope: expose learner history, attempt outcomes, and completion state from `gca_progress` / `gca_test_attempts` in a user-facing dashboard.
	Primary files: `docs/gca-implementation-checklist.md`, `src/components/gca/GcaTestPlayer.tsx`, `src/pages/OperatorProfile.tsx`, related GCA hooks under `src/hooks`.
	Validation target: UI test proving attempt history renders and updates after a completed test attempt.

3. `P5.1` Finish authored OAP content for sections 1-7.
	Scope: replace placeholder or empty lesson bodies with production content, quiz banks, and walkthrough items for each section.
	Primary files: `docs/oap-implementation-checklist.md`, `src/pages/OapCoursePlayer.tsx`, `src/hooks/useOapProgram.ts`, training-library and seeding surfaces under `supabase`.
	Validation target: content integrity check plus seeded E2E proving a learner can finish a real section with authored lesson and quiz content.

4. `P5.2` Validate mentor and employer walkthrough flows end-to-end.
	Scope: prove session creation, walkthrough completion, and downstream certification behavior rather than only auth gating.
	Primary files: `src/pages/OapWalkthrough.tsx`, `src/hooks/useOapWalkthrough.ts`, `e2e/oap.spec.ts`.
	Validation target: seeded Playwright scenario covering mentor walkthrough start, checkoff completion, and completion state.

5. `P6.1` and `P6.3` close the portability proof gap.
	Scope: prove certificate issue to transcript sync, transfer-code creation, token redemption, and cross-org visibility changes with executable tests.
	Primary files: `src/hooks/useOperatorProfile.ts`, `src/hooks/useOapRecert.ts`, `src/pages/OapMyTranscript.tsx`, `src/pages/TalentBrowse.tsx`.
	Validation target: integration or Playwright flow that issues a cert, syncs it to transcript/profile, redeems a transfer token, and verifies downstream visibility.

## 6. Review Notes

- `P3.1` to `P3.3` remain validated for the scoped work that landed, but execution views still surface legacy setup-sheet readiness in `src/components/queue/QueueItemRoutingTab.tsx` rather than the full first-class package model. Treat Phase 3 schema and readiness as landed infrastructure, not the end of document-control adoption.
- `P4.2` was stale in the prior tracker state. In-app GCA testing is now partially implemented and should be planned as a completion task, not a greenfield task.
