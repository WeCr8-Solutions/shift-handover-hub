# Admin Platform Phase 0 Baseline

## Purpose

This document begins Phase 0 and Phase 1 execution for the Admin Platform Operations roadmap.

It is a practical baseline for the delivery team. The roadmap defines the target state; this file identifies the current starting point, the first completed setup work, and the next implementation slices.

## Scope of This Baseline

This baseline covers the first implementation layer for the admin-platform program:

- local documentation coverage in active directories
- current admin and settings ownership boundaries
- core existing modules already in the codebase
- near-term implementation priorities

## Phase 0 Work Completed

The following work is now complete:

- Added the master roadmap in `docs/admin-platform-operations-roadmap.md`
- Added `README.md` and `CHANGELOG.md` to `docs/`
- Added `README.md` and `CHANGELOG.md` to `src/components/admin/`
- Added `README.md` and `CHANGELOG.md` to `src/components/settings/`
- Added `README.md` and `CHANGELOG.md` to `supabase/functions/send-policy-change-notification/`
- Established the standing rule that every touched directory must maintain local `README.md` and `CHANGELOG.md` files

## Current Ownership Boundaries

### Platform Admin Surface

Primary code surface:

- `src/pages/Admin.tsx`
- `src/components/admin/`

Primary responsibility:

- platform oversight
- org oversight
- legal and policy operations
- support and audit operations
- internal operational tools

### Settings Surface

Primary code surface:

- `src/pages/Settings.tsx`
- `src/components/settings/`

Primary responsibility:

- user settings
- org settings within tenant scope
- org-admin billing and compliance controls that belong in settings rather than platform back office

### Policy Notification Backend

Primary code surface:

- `supabase/functions/send-policy-change-notification/`

Primary responsibility:

- legal policy-notice email sending
- dedupe and delivery logging support for policy change notifications

## Current Admin Platform Baseline

### Existing Strengths

- Admin shell, role gating, and scope handling already exist.
- Organization settings already cover profile, billing email, SSO, SIEM, and compliance controls.
- Billing settings already cover plan, seats, usage, and upgrade/portal flows.
- Policy notifications already support draft and send operations.
- Organization oversight already supports cross-org visibility and complimentary access.
- Talent search already provides candidate, outreach, and recruiting workflows.

### Immediate Gaps Still Open

- no full policy acceptance ledger yet
- no complete billing back-office surface yet
- no full email operations center yet
- no unified admin audit model yet
- no talent-governance and trust-and-safety operating layer yet
- no executive reporting layer yet

## Directory Documentation Coverage Status

| Directory | README | CHANGELOG | Status |
| --- | --- | --- | --- |
| `docs/` | Yes | Yes | Baseline complete |
| `src/components/admin/` | Yes | Yes | Baseline complete |
| `src/components/settings/` | Yes | Yes | Baseline complete |
| `supabase/functions/send-policy-change-notification/` | Yes | Yes | Baseline complete |

## Recommended Next Implementation Slices

Implementation should proceed in small, auditable slices. The recommended order remains aligned with the roadmap.

### Slice 1: Policy Acceptance Ledger Foundation

Goal:

- move from policy notification to policy acknowledgement and evidence

Suggested outputs:

- acceptance data model
- admin reporting requirements
- UI entry points for acknowledgement state
- audit rules for version acceptance

### Slice 2: Billing Back-Office Foundation

Goal:

- expand from plan visibility to supportable billing operations

Suggested outputs:

- invoice and receipt visibility model
- payment-method health view
- seat-history and manual adjustment rules
- failure and dunning state handling

### Slice 3: Email Operations Foundation

Goal:

- treat message delivery as an operational system rather than a send button

Suggested outputs:

- template/version model
- suppression and delivery diagnostics plan
- send approvals and blast safeguards
- categorized message classes

## Phase 0 Exit Criteria

Phase 0 should be considered complete when:

- the roadmap is in repo docs
- the core active admin directories have local `README.md` and `CHANGELOG.md` coverage
- the delivery team has a clear baseline of current capabilities and gaps
- the first real implementation slice is selected and scoped

## Phase 1 Entry Recommendation

The recommended Phase 1 entry is:

1. Define the policy acceptance ledger data model and audit requirements.
2. Identify the exact frontend and backend surfaces that need to change first.
3. Add any missing local documentation in newly touched directories before implementation begins there.

## Notes for Contributors

- If you touch a new directory while executing this program, add or update its local `README.md` and `CHANGELOG.md` in the same change.
- Use this file as a quick baseline checkpoint before opening new implementation slices.
- Use the roadmap file for scope, business framing, ownership, and long-range sequencing.
