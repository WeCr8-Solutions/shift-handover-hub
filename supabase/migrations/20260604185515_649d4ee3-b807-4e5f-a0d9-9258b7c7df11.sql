-- Allow platform admins and developers to insert and delete Manufacturing 100 nominations
-- so editors can add honorees manually (not only via the public form) and archive entries.

CREATE POLICY "Admins can insert nominations"
  ON public.mfg_100_nominations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Developers can insert nominations"
  ON public.mfg_100_nominations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'developer'::public.app_role));

CREATE POLICY "Admins can delete nominations"
  ON public.mfg_100_nominations
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Developers can delete nominations"
  ON public.mfg_100_nominations
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::public.app_role));