-- Fix overly permissive email_leads INSERT policy
-- Add basic validation: email must be reasonable length and have @ symbol
DROP POLICY IF EXISTS "Anyone can submit email leads" ON public.email_leads;

CREATE POLICY "Anyone can submit email leads with validation"
ON public.email_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(email) BETWEEN 5 AND 255
  AND email LIKE '%@%.%'
  AND (source_page IS NULL OR length(source_page) <= 500)
  AND (lead_type IS NULL OR length(lead_type) <= 50)
);