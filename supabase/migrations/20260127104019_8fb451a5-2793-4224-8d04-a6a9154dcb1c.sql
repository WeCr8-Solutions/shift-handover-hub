-- Allow creators to view organizations they just created
-- This is needed for INSERT...RETURNING to work before membership is created
CREATE POLICY "Users can view organizations they created"
  ON public.organizations FOR SELECT
  USING (auth.uid() = created_by);