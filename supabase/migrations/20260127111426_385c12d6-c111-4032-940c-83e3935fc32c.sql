-- Fix: Make performance-updates storage bucket private and add proper RLS

-- Step 1: Make the bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'performance-updates';

-- Step 2: Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view performance update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload performance update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own performance update images" ON storage.objects;

-- Step 3: Create new properly scoped RLS policies

-- Users can only view images they uploaded (via folder path)
CREATE POLICY "Users can view own performance update images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'performance-updates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Team members and supervisors can view images from their team's performance updates
CREATE POLICY "Team members can view team performance update images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'performance-updates'
  AND EXISTS (
    SELECT 1 FROM public.job_performance_updates jpu
    WHERE jpu.image_urls @> ARRAY[
      (SELECT url FROM (
        SELECT name as url FROM storage.objects WHERE id = storage.objects.id
      ) sub)
    ]
    AND (
      jpu.team_id IS NULL
      OR public.is_team_member(auth.uid(), jpu.team_id)
      OR public.has_role(auth.uid(), 'admin')
      OR public.is_supervisor_for_team(auth.uid(), jpu.team_id)
    )
  )
);

-- Users can upload their own images (folder-based isolation)
CREATE POLICY "Users can upload performance update images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'performance-updates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own images
CREATE POLICY "Users can update own performance update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'performance-updates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images
CREATE POLICY "Users can delete own performance update images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'performance-updates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);