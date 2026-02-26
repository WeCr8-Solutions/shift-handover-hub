

# Fix Org-Wide Overview for Supervisors and Org Owners

## Problem

When supervisors/org owners select "Personal Workspace" in the TeamSelector, it's misleading -- it should represent "All Teams (Org Overview)." The current flow forces users to pick a single team from the dropdown rather than seeing their entire manufacturing operation at a glance. The SupervisorDashboard already supports org-wide data when `currentTeam` is `null` (via `useStations` filtering by `organization_id`), but the UI labels and flow don't communicate this.

## Changes

### 1. `src/components/TeamSelector.tsx` -- Rename "Personal Workspace" to org-aware label

- Replace `"Personal Workspace"` with the actual organization name + "All Teams" (e.g., "Acme Mfg · All Teams")
- Use the org name from `useUserOrganization()` hook
- Change the icon from `Building2` to a `Factory` icon for the org-wide option
- Keep individual team options as-is
- When `currentTeam` is `null`, it means "show everything in the org" -- this is already how `useStations` works (filters by `organization_id` when no `team_id` is passed)

### 2. `src/components/dashboard/SupervisorDashboard.tsx` -- Show org context in header

- Update the subtitle text: when `currentTeam` is `null`, show `"{orgName} · All Teams"` instead of `"All Teams"`
- Add a team filter badge row below the KPI stats that shows each team as a clickable chip, allowing quick team filtering without using the header dropdown
- This gives supervisors inline context switching: "All Teams" overview with ability to tap into a specific team

### 3. `src/contexts/TeamContext.tsx` -- Default to `null` (org-wide) for supervisors

- When auto-selecting on load, if user `hasOrgSupervisorAccess`, default to `null` (org-wide view) instead of the first team
- This ensures supervisors land on the full org overview by default
- Operators still auto-select their first team

### 4. `src/hooks/useStations.ts` -- Ensure handoff records also filter by org

- `useHandoffRecords` currently only filters by `teamId` -- when `teamId` is null, it returns ALL records (no org filter)
- Add `organization_id` filtering to `useHandoffRecords` matching the pattern already used in `useStations`

## Files

| File | Change |
|------|--------|
| `src/components/TeamSelector.tsx` | Rename "Personal Workspace" to org name + "All Teams", add Factory icon |
| `src/components/dashboard/SupervisorDashboard.tsx` | Show org name in header, add inline team filter chips |
| `src/contexts/TeamContext.tsx` | Default supervisors to org-wide view (null team) |
| `src/hooks/useStations.ts` | Add org_id filter to `useHandoffRecords` |

