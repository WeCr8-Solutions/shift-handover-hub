# JobLine AI — Manufacturing Platform Audit, Remediation Order, and Validation PRD

**Date:** 2026-04-21  
**Status:** Active  
**Severity:** Critical — broad product scope exists, but runtime stability, ERP parity, and verification depth are below the level required for production confidence

---

## 1. Executive Summary

This document converts the current manufacturing platform audit into an execution plan in the correct order.

The platform already contains substantial implementation for:

- Manufacturing queue, routing, handoffs, dimensions, and setup-sheet attachment
- ERP connector configuration and SAP sync behavior
- ITAR-aware read-through vs. write-through data-source control
- OAP framework, operator profile, portable credentials, and AI planning assistant

The platform is **not yet fully validated or uniformly complete**. The controlling risks are:

1. Local runtime and validation are unstable because declared frontend dependencies are not installed in the current environment.
2. JobBOSS read-through parity is incomplete in the unified queue path.
3. The system supports per-operation setup documents, but does not yet model a full controlled multi-document part package.
4. GCA remains materially incomplete relative to the target product.
5. End-to-end verification does not yet match the business-critical scope of the platform.

This PRD defines:

- What the platform must do
- What is already present
- What is missing
- The correct execution order
- The validation gate for each step
- The tracker structure used to measure completion

---

## 2. Target Outcome

The target system is a unified manufacturing operations platform that:

1. Runs a production-floor dashboard for queue, routing, shift handoffs, station execution, quality checks, and outside processing.
2. Connects an organization to native Supabase, JobBOSS, SAP, or similar ERP/MES sources with clear persistence and ITAR-safe read-through rules.
3. Supports machine-aware and controller-aware execution context across Haas, Fanuc, Siemens, Mazak, Okuma, and similar environments.
4. Supports document-driven manufacturing execution with drawings, setup sheets, inspection plans, and instruction sets tied to work execution.
5. Provides GCA as the global G-code and controller education layer.
6. Provides OAP as the employer-operable operator acceptance and sign-off layer.
7. Syncs earned credentials into portable operator profiles that can follow workers between employers.
8. Uses AI as a constrained planning and recommendation layer, and eventually as a controlled approval-assist layer where policy allows.

---

## 3. Current State Summary

### 3.1 Strongly Implemented

- Queue items, routing, routing templates, dimensions, setup-sheet attachment
- Shift, station, and operation handoffs
- SAP connector structure and edge-function sync path
- ITAR-aware data-source mode control
- OAP framework and operator profile foundation
- AI planning assistant context assembly and routing proposal flow

### 3.2 Partially Implemented

- JobBOSS live read-through behavior in unified queue consumption
- Multi-document package behavior for manufacturing execution
- GCA in-app learning and testing experience
- Cross-surface certification propagation validation
- Public and employer talent flow verification

### 3.3 Verified Gaps

- The local runtime currently fails to resolve `qrcode`, `jspdf`, and `papaparse` even though they are declared in `package.json`.
- `node_modules` is currently not in a healthy state for validation; `npm ls qrcode jspdf papaparse --depth=0` returns an empty tree in the current workspace.
- `useUnifiedQueue` explicitly documents that JobBOSS read-through still falls back until a future read endpoint lands.
- Existing Playwright coverage is mostly route-smoke level, not business-flow level.

---

## 4. Scoring Baseline

| Area | Score | Notes |
|---|---:|---|
| Manufacturing dashboard core | 8.5/10 | Strong workflow implementation; verification depth still low |
| ERP / MES integration | 6.8/10 | SAP stronger than JobBOSS read-through |
| Handoffs / passovers / routing continuity | 8.7/10 | Good structure and unit coverage |
| Machine / controller context | 7.4/10 | Good modeling, incomplete end-to-end proof |
| Multi-document part package | 6.1/10 | Per-step docs exist; package-control model incomplete |
| GCA | 5.8/10 | Important target features still incomplete |
| OAP | 8.0/10 | Framework strong; content depth still needed |
| Talent portability | 8.2/10 | Good base, limited full-flow validation |
| AI planning / approval assist | 7.6/10 | Good controls and context, limited outcome verification |

---

## 5. Execution Rules

Work must happen in this order because later steps depend on earlier proof.

1. **Restore runtime and validation first.**
   Reason: no meaningful completion claim is credible while the local app cannot boot reliably.

2. **Stabilize the verification harness second.**
   Reason: without repeatable build, unit, and smoke validation, feature work increases uncertainty.

3. **Close ERP parity gaps before broadening product scope.**
   Reason: data-source behavior controls queue, planning, and ITAR-safe execution.

4. **Upgrade the manufacturing document model before claiming full shop-floor package readiness.**
   Reason: routing execution depends on document completeness and revision clarity.

5. **Complete GCA and OAP integration depth after core execution is stable.**
   Reason: credentials are only as trustworthy as the workflows that issue them.

6. **Validate profile portability and AI-assisted flows after certification flows are stable.**
   Reason: portability and AI rely on correct credential state.

---

## 6. Ordered Remediation Plan

### Phase 0 — Runtime Recovery and Baseline Validation

**Need**

The app must install, boot, and expose a stable local runtime so tests can run against an actual application.

**Current evidence**

- Declared dependencies exist in `package.json`.
- Current runtime reports unresolved imports for `qrcode`, `jspdf`, and `papaparse`.
- Current local package tree is effectively empty for those packages.

**Required work**

1. Restore dependency installation for the active package manager path.
2. Confirm `vite` boots without unresolved-import errors.
3. Confirm unit tests run from a stable dependency tree.
4. Confirm Playwright can execute without on-demand install failures.

**Definition of done**

- `npm install` completes successfully in the workspace.
- `npm run dev` boots without unresolved module errors.
- `npm test` can execute targeted suites.
- `npx playwright test` resolves against local dependencies.

**Validation gate**

- `npm ls qrcode jspdf papaparse --depth=0`
- `npm run build`
- targeted `npm test`
- targeted Playwright smoke suite

---

### Phase 1 — Verification Harness Upgrade

**Need**

The repo needs a trustworthy validation stack that maps to the actual product risks.

**Current evidence**

- Focused unit coverage exists for handoffs, machine types, queue slices, and ERP hook behavior.
- Existing E2E coverage is mostly route-smoke level for GCA/OAP public surfaces.
- Operator station tests pass but emit repeated `act(...)` warnings.

**Required work**

1. Eliminate noisy async test warnings in the operator dashboard slice.
2. Add smoke tests that prove authenticated and unauthenticated route behavior from a running app.
3. Add business-flow tests for the highest-risk paths.

**Definition of done**

- No recurring `act(...)` warnings in the targeted suite.
- At least one executable flow exists for each critical business surface.

**Validation gate**

- targeted unit suite
- targeted Playwright suite

---

### Phase 2 — ERP Parity and Data-Source Correctness

**Need**

Native, SAP, and JobBOSS paths must behave predictably under the unified queue and planning surfaces.

**Current evidence**

- SAP has a real sync path.
- Generic ERP sync includes plan, auth, logging, and persistence-mode controls.
- JobBOSS read-through parity is incomplete in `useUnifiedQueue`.

**Required work**

1. Implement or complete JobBOSS live read-through response shape for unified consumption.
2. Verify queue, dashboard, and planning behavior in native, read-through, and write-through modes.
3. Verify ITAR-safe behavior in read-through mode.

**Definition of done**

- Unified queue returns meaningful JobBOSS read-through records.
- Data-source banner and downstream workflow behave correctly by mode.
- No write-through leakage occurs for ITAR-flagged orgs.

**Validation gate**

- unit tests for `useUnifiedQueue`
- edge-function tests for ERP paths
- smoke test covering queue loading by source mode

---

### Phase 3 — Manufacturing Package and Document-Control Upgrade

**Need**

The system must move from per-step document attachment to a controlled manufacturing package model.

**Current evidence**

- Setup sheets, drawings, instruction sets, and inspection plans can be attached per routing step.
- No explicit package entity or release workflow exists.

**Required work**

1. Define the package model: part package, document types, revision state, approval state, and completeness rules.
2. Support grouped multi-document packages tied to work order, routing, and part identity.
3. Add package completeness and revision visibility in queue/routing execution views.

**Definition of done**

- A work order can expose a coherent document package, not just flat per-step attachments.
- Revision and approval status are visible.
- Missing required documents are detectable and actionable.

**Validation gate**

- schema + UI tests
- execution smoke proving document retrieval during routing flow

---

### Phase 4 — GCA Completion

**Need**

GCA must be a first-class in-app credentialing and learning product, not just a partially integrated static property.

**Current evidence**

- Repo checklist still marks in-app lesson reader and test player as incomplete.
- Progress data exists but is not fully surfaced.

**Required work**

1. Deliver the in-app lesson reader.
2. Deliver the in-app test player against live `gca_test_attempts`.
3. Surface progress and credential state in app.
4. Complete profile linkage and public credential surfacing where intended.

**Definition of done**

- GCA learning, testing, progress, and issued credentials all operate in-app.

**Validation gate**

- unit tests for player logic
- E2E for test attempt and result path
- profile sync verification

---

### Phase 5 — OAP Content and Execution Completion

**Need**

OAP framework exists, but section depth and walkthrough content must match the product promise.

**Current evidence**

- Core OAP mechanics are present.
- Section content completion is still incomplete by checklist.

**Required work**

1. Author remaining lessons, quizzes, and walkthrough items.
2. Verify mentor and employer flows with real seeded content.
3. Verify certificate issuance and transcript sync end-to-end.

**Definition of done**

- Each OAP section has production-usable content and walkthrough coverage.

**Validation gate**

- content integrity checks
- mentor/employer E2E flows

---

### Phase 6 — Portable Credential and Talent Network Validation

**Need**

Verified operator credentials must move reliably into profiles and remain portable between employers.

**Current evidence**

- Operator profile and credential sync code exist.
- Full-flow validation is thin.

**Required work**

1. Validate cert issue → transcript → profile sync.
2. Validate public profile and employer search visibility rules.
3. Validate transfer-token and portability workflows.

**Definition of done**

- Credential state is consistent across issue, transcript, profile, and transfer flows.

**Validation gate**

- targeted integration tests
- employer/operator flow E2E

---

### Phase 7 — AI Planning and Approval Confidence

**Need**

AI assistance must be demonstrably constrained, useful, and correct enough for planning and recommendation workflows.

**Current evidence**

- Good auth, policy, injection, and usage controls exist.
- Limited automated validation of recommendation quality exists.

**Required work**

1. Add deterministic tests around extracted routing proposals.
2. Validate behavior when required context is missing.
3. Verify source-mode awareness and document/SOP prompts.

**Definition of done**

- The planning assistant behaves predictably for core planning prompts and proposal extraction.

**Validation gate**

- unit and edge-function tests
- prompt/response fixture tests

---

## 7. Cross-Cutting Requirements

The following must be preserved throughout all phases:

- ITAR-safe read-through behavior
- org-scoped RLS and auditability
- profile portability and certificate integrity
- controller-aware and machine-aware terminology consistency
- no regression of existing handoff/routing behavior

---

## 8. Immediate Execution Sequence

The next concrete work items, in order, are:

1. Restore dependency installation and stable local runtime.
2. Re-run build and focused tests from the repaired environment.
3. Re-run Playwright smoke tests from the repaired environment.
4. Repair the highest-confidence app/runtime blockers found during those checks.
5. Move to JobBOSS unified queue parity.

---

## 9. Completion Standard

A step is only complete when all four conditions are true:

1. The need is documented.
2. The implementation exists.
3. The implementation has an executable validation path.
4. The result is reflected in the completion tracker.
