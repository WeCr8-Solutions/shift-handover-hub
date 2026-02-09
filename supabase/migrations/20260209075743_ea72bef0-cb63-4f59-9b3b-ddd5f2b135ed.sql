-- Fix the issues INSERT policy to work correctly with security definer functions
-- The current policy checks auth.uid() = reporter_id, but the security definer 
-- function sets reporter_id to auth.uid() correctly already.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;

-- Create a simpler policy that allows authenticated users to insert
-- The reporter_id constraint is enforced by the report_issue function
CREATE POLICY "Authenticated users can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only report issues with themselves as reporter
  reporter_id = auth.uid()
);

-- Also ensure the report_issue function can bypass RLS for inserting
-- by ensuring it runs correctly as SECURITY DEFINER
-- Re-create the function to ensure it works
CREATE OR REPLACE FUNCTION public.report_issue(
  _title text,
  _description text DEFAULT NULL,
  _severity issue_severity DEFAULT 'medium',
  _error_message text DEFAULT NULL,
  _error_stack text DEFAULT NULL,
  _console_logs jsonb DEFAULT '[]',
  _page_url text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _profile RECORD;
  _org_id UUID;
  _issue_id UUID;
BEGIN
  -- Get authenticated user
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to report issues';
  END IF;

  -- Get profile info
  SELECT display_name, email INTO _profile
  FROM public.profiles WHERE user_id = _user_id;

  -- Get user's organization (if any)
  SELECT organization_id INTO _org_id
  FROM public.organization_members WHERE user_id = _user_id LIMIT 1;

  -- Insert the issue (SECURITY DEFINER bypasses RLS)
  INSERT INTO public.issues (
    reporter_id, 
    reporter_email, 
    reporter_display_name,
    title, 
    description, 
    severity,
    error_message, 
    error_stack, 
    console_logs,
    page_url, 
    organization_id, 
    metadata,
    status,
    user_agent,
    app_version,
    build_id,
    commit_hash,
    environment
  ) VALUES (
    _user_id, 
    _profile.email, 
    _profile.display_name,
    _title, 
    _description, 
    _severity,
    _error_message, 
    _error_stack, 
    _console_logs,
    _page_url, 
    _org_id, 
    _metadata,
    'new',
    _metadata->>'user_agent',
    _metadata->>'app_version',
    _metadata->>'build_id',
    _metadata->>'commit_hash',
    _metadata->>'environment'
  )
  RETURNING id INTO _issue_id;

  RETURN _issue_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.report_issue TO authenticated;