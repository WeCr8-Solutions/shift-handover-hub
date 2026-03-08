
-- Add part_image_url column to queue_items
ALTER TABLE public.queue_items ADD COLUMN IF NOT EXISTS part_image_url TEXT;

-- Create part-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('part-images', 'part-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for part-images bucket
CREATE POLICY "Org members can upload part images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'part-images');

CREATE POLICY "Org members can view part images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'part-images');

CREATE POLICY "Supervisors can delete part images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'part-images');
