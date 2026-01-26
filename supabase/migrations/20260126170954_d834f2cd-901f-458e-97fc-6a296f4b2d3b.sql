-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

-- Create a permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create teams" 
ON public.teams 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);