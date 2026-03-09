# 07 - Local LLM Test Repair PRD

## Document Purpose

Define a token-efficient repair workflow where local LLM models (Ollama) perform first-pass test failure analysis and patch suggestions, while final verification stays in-repo.

## Current Snapshot (2026-03-09)

- Full suite command: `npm test`
- Latest full run result: `Test Files 11 failed | 44 passed (57)`
- Dominant failure signature: `useAuth must be used within an AuthProvider`
- Secondary platform risk recently addressed: JS heap pressure in CI Vitest runs

## Confirmed Fixes Already Applied

1. CI cache lockfile path hardening
- File: `.github/workflows/test.yml`
- Change: add `cache-dependency-path: package-lock.json` for root jobs.

2. CI test memory headroom
- File: `.github/workflows/test.yml`
- Change: run tests with `NODE_OPTIONS=--max-old-space-size=4096`.

3. CI Vitest concurrency reduction
- File: `vitest.config.ts`
- Change: `maxWorkers` and `fileParallelism` constrained in CI.

4. TypeScript mock typing fix
- File: `src/components/TeamManagement.test.tsx`
- Change: `const mockFrom = vi.mocked(supabase.from);`

5. Local LLM repair task completed (scoped)
- Files:
  - `src/components/ncr/QualityMetricsDashboard.test.tsx`
  - `src/components/ncr/CreateNCRDialog.test.tsx`
- Change: file-local `vi.mock("@/hooks/useUserOrganization", ...)` to decouple from auth context in those tests.
- Verification: both files pass together (`12/12 tests`).

## Error Inventory and Repair Targets

### Group A - Missing Auth Context in Provider Chain

Primary runtime path:
- `src/test/test-utils.tsx` (AllProviders wrapper)
- `src/contexts/OrgContext.tsx` (OrgProvider invokes `useUserOrganization`)
- `src/hooks/useUserOrganization.ts` (calls `useAuth`)
- `src/contexts/AuthContext.tsx` (throws when context is undefined)

Observed hotspot lines from stack traces:
- `src/test/test-utils.tsx:29`
- `src/contexts/OrgContext.tsx:47`
- `src/hooks/useUserOrganization.ts:124`
- `src/contexts/AuthContext.tsx:210`

Failed file set observed in latest full run output:
- `src/components/alerts/SmartAlertCard.test.tsx`
- `src/components/alerts/SmartAlertPanel.test.tsx`
- `src/components/settings/__tests__/ReadOnlyGate.test.tsx`
- `src/components/settings/__tests__/SettingsFooter.test.tsx`
- `src/components/settings/__tests__/SettingsSkeleton.test.tsx`
- `src/components/settings/__tests__/SettingsSwitchRow.test.tsx`
- `src/components/station/__tests__/MachineCapabilityBadges.test.tsx`

Notes:
- Several failing files likely share the same root cause and can be fixed in a batched, file-scoped mocking pass.
- A global test wrapper change to include `AuthProvider` can introduce regressions when tests mock `@/contexts/AuthContext` incompletely.

### Group B - Memory Stability (Mitigated, Monitor)

Symptoms previously observed:
- `FATAL ERROR: Ineffective mark-compacts near heap limit`

Mitigations already in place:
- `.github/workflows/test.yml` heap increase
- `vitest.config.ts` CI worker throttling

Residual risk:
- Local machines or non-CI runs may still OOM if parallelism is forced externally.

## Local LLM Repair Checklist System

Use this checklist exactly in order.

### Stage 0 - Preconditions

- [ ] Confirm local Ollama endpoint: `http://localhost:11434/api/tags`
- [ ] Confirm model availability: `qwen2.5-coder:7b` (default)
- [ ] Keep deterministic generation (`temperature=0.1`)

### Stage 1 - Baseline Capture

- [ ] Run `npm test` and save output snapshot
- [ ] Group failures by repeated signature
- [ ] Extract common stack frames and target files

### Stage 2 - File-Scoped Repair Pass (Local LLM First)

For each failing test file in Group A:

- [ ] Add local mock for `@/hooks/useUserOrganization` with required shape:
  - `organization`
  - `organizationRole`
  - `teams`
  - `userRoles`
  - `primaryRole`
  - `primaryTeam`
  - `loading`
  - `refresh`
- [ ] Avoid global wrapper changes unless all auth mocks are normalized
- [ ] Keep edits minimal and test-file-local

### Stage 3 - Verification After Each Repair Batch

- [ ] Run `npx vitest run <file1> <file2> ...` for edited files
- [ ] Run `npx tsc --noEmit -p tsconfig.app.json`
- [ ] If green, continue to next failure batch

### Stage 4 - Final Verification

- [ ] Run `npm test`
- [ ] Compare `failed` counts vs prior snapshot
- [ ] Stop only when no regressions are introduced in unrelated test areas

## Prompt Template for Local LLM

Use this prompt per failing test file:

```text
You are repairing a Vitest TypeScript test file in this repo.

Goal:
Fix auth-context related test failure with minimal, file-scoped changes.

Constraints:
- Do not modify shared test wrapper in src/test/test-utils.tsx.
- Prefer mocking @/hooks/useUserOrganization inside this test file.
- Keep existing assertions and test intent unchanged.
- Return a unified diff for this file only.
```

## Final Verification Status at Time of Writing

- Focused repaired files pass:
  - `src/components/ncr/QualityMetricsDashboard.test.tsx`
  - `src/components/ncr/CreateNCRDialog.test.tsx`
- Full suite still failing due unresolved Group A files.
- This PRD is ready for iterative local-LLM repair execution.

## Acceptance Criteria

- [ ] All auth-context-related test failures resolved without global regressions
- [ ] No new TypeScript errors introduced
- [ ] Full suite passes locally (`npm test`)
- [ ] CI jobs pass with current memory and cache configuration
