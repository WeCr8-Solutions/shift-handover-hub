INSERT INTO public.training_media (
  entity_type, entity_id, media_type, mime_type, storage_bucket, storage_path,
  caption, alt_text, is_primary, is_canonical, organization_id, sort_order
)
SELECT
  'inspection_tool', it.id, 'video', 'video/youtube', 'external', v.url,
  v.caption, v.caption, true, true, NULL, 0
FROM (VALUES
  ('outside-micrometer',    'https://www.youtube.com/watch?v=GIfFwTwspnE',
   'How to read an outside micrometer (0.0001")'),
  ('height-gauge-digital',  'https://www.youtube.com/watch?v=YYL6OoZ5tnE',
   'Using a digital height gage on a granite plate'),
  ('height-gauge-vernier',  'https://www.youtube.com/watch?v=0sM7zHrn8nM',
   'Reading a vernier height gage')
) AS v(slug, url, caption)
JOIN public.inspection_tools it
  ON it.slug = v.slug AND it.is_canonical = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type = 'inspection_tool'
    AND tm.entity_id = it.id
    AND tm.storage_path = v.url
);