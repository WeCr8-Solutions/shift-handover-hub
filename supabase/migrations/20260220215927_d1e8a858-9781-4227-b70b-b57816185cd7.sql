-- 1. Allow org name/slug reuse across organizations
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_slug_key;

-- 2. Re-scope station uniqueness from team to organization
ALTER TABLE public.stations DROP CONSTRAINT IF EXISTS stations_team_id_station_id_key;
CREATE UNIQUE INDEX stations_organization_id_station_id_key 
  ON public.stations (organization_id, station_id);