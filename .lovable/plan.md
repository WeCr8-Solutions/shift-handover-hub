

# Global Update & System Notice Engine

## Overview

Replace the basic admin-only `changelogs` table with a comprehensive `global_updates` system that serves as a central release feed visible to all users, with full admin/developer control, a public `/updates` route, notification indicators, and user acknowledgement tracking.

## Phase 1: Database -- New `global_updates` Table

Create a new `global_updates` table (keeping `changelogs` for backward compatibility, can be deprecated later):

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | Auto-generated |
| version_number | text | e.g. "v1.2.4" |
| revision_number | integer | Auto-incrementing internal counter |
| title | text NOT NULL | What changed |
| summary | text | Short description |
| full_description | text | Markdown-supported long form |
| category | enum | feature, improvement, bug_fix, system_notice, security, maintenance |
| status | enum | live, scheduled, investigating, resolved, deprecated |
| impact_level | enum | low, medium, high, critical |
| affected_modules | text[] | e.g. {"Shift Handoff", "Machine Tracking"} |
| how_it_helps_users | text | User-facing benefit explanation |
| issues_addressed | text[] | List of resolved issues |
| created_by | uuid | References profiles |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |
| published_at | timestamptz | When made visible |
| is_visible_to_users | boolean | Default false |
| requires_acknowledgement | boolean | Default false |

Create a `global_update_acknowledgements` table for tracking:

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | Auto-generated |
| update_id | uuid FK | References global_updates |
| user_id | uuid | References auth.users |
| acknowledged_at | timestamptz | Default now() |
| UNIQUE | (update_id, user_id) | One ack per user per update |

### Enums

- `update_category`: feature, improvement, bug_fix, system_notice, security, maintenance
- `update_status`: live, scheduled, investigating, resolved, deprecated
- `impact_level`: low, medium, high, critical

### RLS Policies

- **SELECT on global_updates**: Authenticated users can read entries where `is_visible_to_users = true` OR user is admin/developer
- **INSERT/UPDATE on global_updates**: Only admin/developer roles
- **DELETE on global_updates**: Only admin role
- **INSERT on acknowledgements**: Authenticated users can insert their own (user_id = auth.uid())
- **SELECT on acknowledgements**: Users can read their own; admins can read all

### Triggers

- Auto-increment `revision_number` on insert
- Auto-set `updated_at` on update

## Phase 2: Admin Panel -- "System Updates" Tab

Replace the existing Changelog tab in the Admin Dashboard with a full **System Updates** manager.

### Admin Form Fields

- Title, Summary, Full Description (with markdown preview)
- Version Number (with auto-increment suggestion based on last version)
- Category selector (6 options with icons)
- Status selector (5 options)
- Impact Level selector (4 options with color coding)
- Affected Modules (multi-select tags)
- "How It Helps Users" text field
- "Issues Addressed" list input
- Visibility toggle (is_visible_to_users)
- Requires Acknowledgement toggle
- Published At date picker (for scheduling)

### Admin List View

- Filterable by category, status, impact level
- Sortable by date, version
- Status badges with color coding
- Quick actions: edit, publish/unpublish, delete

### Analytics Section (within admin)

- View count per update (tracked via acknowledgements table)
- Acknowledgement rate for required updates
- Total published vs draft count

## Phase 3: Public `/updates` Route

Create a new page at `/updates` accessible to all authenticated users.

### Features

- Reverse-chronological feed of published updates
- Filter chips: Feature, Bug Fix, Maintenance, Security, System Notice, Improvement
- Search by version number or title
- Each update card displays:
  - Version number + revision badge
  - Release date (formatted)
  - Category icon + label
  - Status badge (color-coded)
  - Impact level indicator (colored dot/bar)
  - Title + summary
  - Expandable "Full Details" with markdown rendering
  - "How This Helps You" section
  - "Issues Resolved" list
  - Acknowledge button (if required)

## Phase 4: Notification Indicator in Header

- Add a notification dot on a new "Updates" icon in the Header
- Query for updates where `is_visible_to_users = true` AND `published_at > last_acknowledged_date`
- Show count badge of unread updates
- If any update has `requires_acknowledgement = true` and user hasn't acknowledged: show a modal on dashboard load

## Phase 5: System Status Indicator (Header Bar)

- Small status chip in the header showing current system health
- Auto-calculated from the latest `system_notice` entries:
  - Green "Operational" -- no active system_notice with status investigating/scheduled
  - Yellow "Degraded" -- active system_notice with impact medium
  - Red "Outage" -- active system_notice with impact high/critical

## Files to Create/Modify

### New Files
1. `src/pages/Updates.tsx` -- Public updates feed page
2. `src/hooks/useGlobalUpdates.ts` -- Data fetching hook for updates
3. `src/components/updates/UpdateCard.tsx` -- Individual update card component
4. `src/components/updates/UpdateFilters.tsx` -- Filter/search controls
5. `src/components/updates/SystemStatusIndicator.tsx` -- Header status chip
6. `src/components/updates/UpdateAcknowledgeModal.tsx` -- Force-acknowledge modal
7. `src/components/admin/SystemUpdatesManager.tsx` -- Full admin CRUD panel (replaces ChangelogManager usage)

### Modified Files
1. `src/App.tsx` -- Add `/updates` route
2. `src/pages/Admin.tsx` -- Replace Changelog tab with System Updates tab
3. `src/components/Header.tsx` -- Add updates notification indicator + system status chip

## Technical Details

### Migration SQL (summary)

```text
1. Create 3 enums: update_category, update_status, impact_level
2. Create global_updates table with all columns, constraints, and indexes
3. Create global_update_acknowledgements table with unique constraint
4. Enable RLS on both tables
5. Create 6 RLS policies (SELECT/INSERT/UPDATE/DELETE as described)
6. Create revision auto-increment trigger
7. Create updated_at trigger
8. Enable realtime on global_updates for live push notifications
```

### Version Auto-Suggestion Logic

Parse the latest `version_number` from the database, split by dots, and suggest:
- Patch bump for bug_fix/improvement
- Minor bump for feature
- Major bump for breaking/security

### Acknowledgement Flow

1. On dashboard load, query unacknowledged updates where `requires_acknowledgement = true`
2. If any exist, show modal with update details and "I Understand" button
3. On click, insert into `global_update_acknowledgements`
4. Modal dismisses; notification badge updates

