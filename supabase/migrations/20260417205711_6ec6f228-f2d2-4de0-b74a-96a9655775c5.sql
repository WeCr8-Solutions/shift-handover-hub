INSERT INTO storage.buckets (id, name, public) VALUES ('oap-gca-certificates', 'oap-gca-certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Certificates are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'oap-gca-certificates');

CREATE POLICY "Platform admins can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'oap-gca-certificates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can update certificates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'oap-gca-certificates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can delete certificates"
ON storage.objects FOR DELETE
USING (bucket_id = 'oap-gca-certificates' AND public.has_role(auth.uid(), 'admin'));