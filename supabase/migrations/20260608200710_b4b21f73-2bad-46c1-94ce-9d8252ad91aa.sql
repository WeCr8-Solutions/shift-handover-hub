-- Restore missing SELECT privilege on public.organizations.
-- RLS policies still control which rows each role can see; this only fixes
-- the table-level GRANT that was somehow stripped, causing every query to
-- return 401 "permission denied for table organizations".
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;
GRANT ALL    ON public.organizations TO service_role;