
-- Grant access to machine-related tables for PostgREST exposure
GRANT SELECT ON public.verified_machine_library TO anon, authenticated;
GRANT ALL ON public.verified_machine_library TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_machine_purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.station_machine_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.station_manual_machine_profiles TO authenticated;
