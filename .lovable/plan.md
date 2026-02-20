

# Allow Name Reuse Across Organizations

## Problem
Currently, two constraints prevent different organizations from using the same names:
1. **Organization slug** (`organizations_slug_key`) is globally unique -- if two businesses both want to be called "ABC Manufacturing", the second one gets blocked.
2. **Station ID** (`stations_team_id_station_id_key`) is unique per team -- but should be scoped per organization so different orgs can have a station called "CNC-1" independently.

Everything else (certifications, equipment asset tags, material lots, work center configs) is already correctly scoped to `organization_id` and allows reuse across orgs.

## What Changes

### 1. Make organization slugs unique per org, not globally
- Drop the global `organizations_slug_key` unique constraint
- Organization names like "ABC Manufacturing" can exist in multiple orgs
- The slug is still stored for URL-friendly display but no longer blocks duplicates
- UUIDs remain the true unique identifiers (never reused)

### 2. Re-scope station ID uniqueness to organization level
- Drop the current `stations(team_id, station_id)` unique index
- Replace with `stations(organization_id, station_id)` -- stations like "CNC-1" can exist in different orgs but not duplicated within the same org
- This is more correct because stations belong to organizations, and teams within the same org shouldn't have conflicting station IDs

### 3. No RLS changes needed
- Existing RLS policies already enforce org-scoped visibility using `is_org_member()` and `is_org_admin()` functions
- Users can only ever see data within their own organization
- Names may match across orgs, but users will never see the other org's data

## Technical Details

**Single database migration** with 3 statements:

```sql
-- 1. Allow org name/slug reuse across organizations
DROP INDEX IF EXISTS organizations_slug_key;

-- 2. Re-scope station uniqueness from team to organization
DROP INDEX IF EXISTS stations_team_id_station_id_key;
CREATE UNIQUE INDEX stations_organization_id_station_id_key 
  ON public.stations (organization_id, station_id);
```

No frontend code changes are needed -- the existing UI and RLS policies already handle org-scoped data isolation correctly.
