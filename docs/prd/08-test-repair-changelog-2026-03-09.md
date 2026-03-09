# Test Repair Changelog - 2026-03-09

## Summary

Completed a broad test stabilization pass with targeted, file-scoped fixes and CI hardening.

## What Changed

- Repaired auth-context test failures by adding local `useUserOrganization` mocks in affected test files.
- Fixed TypeScript mock typing issue for `supabase.from` in TeamManagement tests.
- Removed `any` badge variant casts by introducing strict `NCRBadgeVariant` typing.
- Stabilized `OperatorStationPanel` tests by mocking heavy dependencies and preventing mock identity churn.
- Hardened CI test execution:
  - explicit npm cache lockfile path for setup-node
  - increased Node heap for test run in workflow
  - reduced Vitest parallelism in CI

## Verification

- Full test suite green: 57/57 files, 569/569 tests.
- TypeScript app typecheck passed.

## Scope

Includes updates across dashboard, queue, NCR, alerts, and UI tests, plus CI/workflow and PRD guidance updates.
