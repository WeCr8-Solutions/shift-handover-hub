
# Allow Name Reuse Across Organizations

## Status: ✅ Complete

Migration applied:
- Dropped global `organizations_slug_key` constraint — org slugs can now be reused across organizations
- Dropped `stations_team_id_station_id_key` constraint and replaced with `stations_organization_id_station_id_key` — station IDs are now unique per organization, not per team
- No RLS or frontend changes needed — existing org-scoped policies already isolate data correctly
