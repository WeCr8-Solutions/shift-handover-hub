
-- Remove remaining legacy policies
DROP POLICY IF EXISTS "Users can view own performance update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own performance update images" ON storage.objects;
DROP POLICY IF EXISTS "perf_updates_delete_own_files" ON storage.objects;
DROP POLICY IF EXISTS "perf_updates_select_org_scoped" ON storage.objects;
