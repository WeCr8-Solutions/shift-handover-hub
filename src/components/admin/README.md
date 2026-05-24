# Admin Components Directory

## Purpose

This directory contains the platform-admin and operations-facing React components used by the admin dashboard.

It is the primary UI surface for:

- Platform oversight
- Organization oversight
- Operational reporting
- Compliance and audit views
- Internal support and developer-facing administration tools
- Admin-side recruiting, training, content, and notification operations

## What Belongs Here

- Components rendered inside the admin dashboard or admin-only tabs
- Platform-level operational tools
- Org-level oversight tools available through the admin experience
- Internal operational panels that support billing, legal notices, support, audits, content, training, and diagnostics

## What Does Not Belong Here

- End-user settings panels that belong in `src/components/settings/`
- General reusable UI primitives that belong in shared UI directories
- Public-facing product components
- Business logic that should live in hooks, service layers, or Supabase functions

## Key Contents

- `OrganizationOversight.tsx` — cross-org oversight and complimentary access workflows
- `PolicyNotificationsManager.tsx` — legal and policy change announcement management
- `PlatformOverviewTab.tsx` — summary view for higher-level platform visibility
- `NotificationQueueStatus.tsx` — email and notification operations visibility
- `DevSettingsPanel.tsx` — internal-only system and developer settings
- `LearnIdeasReview.tsx` — admin review surface for learn-platform submissions
- `training-library/` — training library admin modules
- `mentors/` — mentor-related admin modules
- `printables/` — printable or export-oriented admin assets

## Operating Rules

- Keep role-sensitive logic explicit and reviewable.
- Treat admin-side write paths as auditable operations.
- Prefer clear separation between platform-admin tools and org-admin tools, even when they share adjacent workflows.
- If a feature becomes primarily customer-facing, move it out of this directory and document the change here.
- Review the local `CHANGELOG.md` before making changes so you can quickly understand why recent admin surface updates were made.

## Relationship To Adjacent Directories

- `src/components/settings/` owns customer and org settings surfaces.
- `src/pages/Admin.tsx` is the route entrypoint that composes many components from this directory.
- `supabase/functions/` owns the backend execution paths that support many admin actions.

## Phase Alignment

This directory is central to the Admin Platform Operations roadmap. During every phase, if files in this directory are touched, both this `README.md` and the paired `CHANGELOG.md` must be kept current.
