# Settings Components Directory

## Purpose

This directory contains settings-oriented React components for personal settings, organization settings, and settings-framework helpers.

It is the primary home for:

- Personal preferences and notification settings
- Organization settings and compliance controls
- Billing and subscription visibility inside settings
- Shared settings-shell helpers and registry wiring

## What Belongs Here

- Components rendered through the settings route and settings registry
- User-facing settings panels
- Organization-admin settings panels that belong in the settings experience rather than the admin back office
- Shared settings support components such as gates, skeletons, footers, and lazy-loading helpers

## What Does Not Belong Here

- Platform-admin operational tools that belong in `src/components/admin/`
- Public-facing components unrelated to settings
- Reusable UI primitives that belong in shared UI directories
- Backend execution logic that should live in hooks or functions

## Key Contents

- `OrganizationSettings.tsx` — org profile, compliance, SSO, SIEM, and billing contact settings
- `BillingSettings.tsx` — plan, seats, limits, and billing portal flows inside settings
- `registry.tsx` — settings information architecture and module registry
- `GeneralSettings.tsx` — user-facing general preferences
- `NotificationSettings.tsx` — notification preferences
- `OnboardingSettings.tsx` — onboarding-related controls
- `LazyTabContent.tsx`, `ReadOnlyGate.tsx`, `SettingsFooter.tsx`, `SettingsSkeleton.tsx` — shared settings support components

## Operating Rules

- Keep customer-facing settings separate from platform back-office operations.
- Make organization-admin controls explicit and role-gated.
- Avoid putting platform-support or internal-debug workflows in this directory.
- When a settings module changes materially, update the local `CHANGELOG.md` so future contributors can see what changed and why.

## Relationship To Adjacent Directories

- `src/pages/Settings.tsx` is the route-level entrypoint for this directory.
- `src/components/admin/` owns platform and internal operations surfaces.
- Hooks and integration layers outside this directory should carry the heavier data and service logic.

## Phase Alignment

This directory is part of the Admin Platform Operations program wherever settings-based billing, compliance, org administration, and user-control flows intersect with the phased roadmap.
