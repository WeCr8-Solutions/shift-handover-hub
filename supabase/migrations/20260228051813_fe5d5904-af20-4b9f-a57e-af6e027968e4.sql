
-- Re-apply grants for machine marketplace tables
-- verified_machine_library: readable by everyone (public catalog)
GRANT SELECT ON public.verified_machine_library TO anon, authenticated;

-- organization_machine_purchases: full CRUD for authenticated (RLS handles scoping)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_machine_purchases TO authenticated;

-- station_machine_assignments: full CRUD for authenticated (RLS handles scoping)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.station_machine_assignments TO authenticated;

-- station_manual_machine_profiles: full CRUD for authenticated (RLS handles scoping)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.station_manual_machine_profiles TO authenticated;
