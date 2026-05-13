-- Allow anonymous SELECT on operator-profiles/{uid}/resume/* when the owner has
-- explicitly toggled resume_public=true on a public+discoverable profile.
-- Mirrors op_files_public_profile_read which already covers public/, gallery/,
-- avatar/banner files.
DROP POLICY IF EXISTS op_files_public_resume_read ON storage.objects;
CREATE POLICY op_files_public_resume_read
ON storage.objects FOR SELECT
USING (
  bucket_id = 'operator-profiles'
  AND (storage.foldername(name))[2] = 'resume'
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles op
    WHERE op.user_id::text = (storage.foldername(name))[1]
      AND op.profile_visibility = 'public'::operator_profile_visibility
      AND op.is_discoverable = true
      AND op.public_published_at IS NOT NULL
      AND op.resume_public = true
  )
);