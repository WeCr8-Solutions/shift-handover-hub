UPDATE public.operator_certifications
SET is_public = true
WHERE verification_source IN ('verified_oap', 'verified_gca', 'local_oap')
  AND is_public = false;