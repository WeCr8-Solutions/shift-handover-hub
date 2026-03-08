-- Drop the existing unique constraint that doesn't handle NULLs properly
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_organization_id_team_id_setting_key_key;

-- Create a unique index that treats NULLs as equal (NULLS NOT DISTINCT)
CREATE UNIQUE INDEX app_settings_org_team_key_unique
ON public.app_settings (organization_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), setting_key);