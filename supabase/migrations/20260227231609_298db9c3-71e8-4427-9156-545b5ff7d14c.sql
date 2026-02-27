
CREATE OR REPLACE FUNCTION public.report_issue(
  _title text,
  _description text DEFAULT NULL,
  _severity issue_severity DEFAULT 'medium',
  _error_message text DEFAULT NULL,
  _error_stack text DEFAULT NULL,
  _console_logs jsonb DEFAULT '[]'::jsonb,
  _page_url text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _profile RECORD;
  _org_id UUID;
  _issue_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to report issues';
  END IF;

  SELECT display_name, email INTO _profile
  FROM public.profiles WHERE user_id = _user_id;

  SELECT organization_id INTO _org_id
  FROM public.organization_members WHERE user_id = _user_id LIMIT 1;

  INSERT INTO public.issues (
    reporter_id, reporter_email, reporter_display_name,
    title, description, severity,
    error_message, error_stack, console_logs,
    page_url, organization_id, metadata,
    status,
    user_agent, app_version, build_id, commit_hash, environment
  ) VALUES (
    _user_id, _profile.email, _profile.display_name,
    _title, _description, _severity,
    _error_message, _error_stack, _console_logs,
    _page_url, _org_id, _metadata,
    'open',
    _metadata->>'user_agent',
    _metadata->>'app_version',
    _metadata->>'build_id',
    _metadata->>'commit_hash',
    _metadata->>'environment'
  )
  RETURNING id INTO _issue_id;

  RETURN _issue_id;
END;
$function$;
