
-- Allow platform admins and developers to read visitor surveys
CREATE POLICY "Admins can read visitor surveys"
  ON public.visitor_surveys
  FOR SELECT
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()));
