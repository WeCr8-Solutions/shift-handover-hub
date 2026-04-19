DROP POLICY IF EXISTS "pv_anyone_insert" ON public.profile_views;

CREATE POLICY "pv_anyone_insert"
  ON public.profile_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    subject_type IN ('talent','employer','card')
    AND length(subject_id) BETWEEN 1 AND 128
    AND (viewer_user_id IS NULL OR viewer_user_id = auth.uid())
    AND (referrer IS NULL OR length(referrer) <= 512)
    AND (user_agent IS NULL OR length(user_agent) <= 512)
  );