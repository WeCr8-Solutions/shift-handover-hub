-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.visitor_surveys;

-- Create a tighter INSERT policy that validates data
CREATE POLICY "Allow anonymous inserts with validation" ON public.visitor_surveys
  FOR INSERT TO anon
  WITH CHECK (
    -- heard_about_us must be non-empty and reasonable length
    length(heard_about_us) > 0 AND length(heard_about_us) <= 200
    -- optional text fields must be reasonable length
    AND (other_heard_about IS NULL OR length(other_heard_about) <= 500)
    AND (other_looking_for IS NULL OR length(other_looking_for) <= 500)
    AND (source_page IS NULL OR length(source_page) <= 500)
    -- looking_for array must not be excessively large
    AND array_length(looking_for, 1) IS NOT DISTINCT FROM array_length(looking_for, 1)
    AND (array_length(looking_for, 1) IS NULL OR array_length(looking_for, 1) <= 20)
  );