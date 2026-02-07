-- =====================================================
-- Fast Issue Reporting: Database Function & Dev Queue
-- =====================================================

-- 1. Create the dev_issue_queue table for developer work tracking
CREATE TABLE public.dev_issue_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  assigned_developer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_developer_name TEXT,
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  queue_position INTEGER NOT NULL,
  estimated_effort TEXT CHECK (estimated_effort IN ('quick_fix', 'medium', 'complex')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'blocked', 'completed', 'deferred')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(issue_id)
);

-- Enable RLS
ALTER TABLE public.dev_issue_queue ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins/developers can access the dev queue
CREATE POLICY "Devs can view queue"
ON public.dev_issue_queue FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

CREATE POLICY "Devs can manage queue"
ON public.dev_issue_queue FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- Create index for faster queries
CREATE INDEX idx_dev_issue_queue_status ON public.dev_issue_queue(status);
CREATE INDEX idx_dev_issue_queue_priority ON public.dev_issue_queue(priority DESC, queue_position ASC);
CREATE INDEX idx_dev_issue_queue_assigned ON public.dev_issue_queue(assigned_developer_id) WHERE assigned_developer_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_dev_issue_queue_updated_at
  BEFORE UPDATE ON public.dev_issue_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create the report_issue database function
CREATE OR REPLACE FUNCTION public.report_issue(
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _severity public.issue_severity DEFAULT 'medium',
  _error_message TEXT DEFAULT NULL,
  _error_stack TEXT DEFAULT NULL,
  _console_logs JSONB DEFAULT '[]'::jsonb,
  _page_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
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

  -- Insert the issue
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

-- 3. Create trigger to auto-queue issues for developers
CREATE OR REPLACE FUNCTION public.queue_issue_for_devs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _priority INT;
  _next_position INT;
BEGIN
  -- Calculate priority based on severity
  _priority := CASE NEW.severity
    WHEN 'critical' THEN 5
    WHEN 'high' THEN 4
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 2
    ELSE 1
  END;

  -- Get next queue position
  SELECT COALESCE(MAX(queue_position), 0) + 1 INTO _next_position 
  FROM public.dev_issue_queue;

  -- Auto-add to dev queue
  INSERT INTO public.dev_issue_queue (issue_id, priority, queue_position)
  VALUES (NEW.id, _priority, _next_position);

  -- Queue email notification for admins/developers
  INSERT INTO public.notification_queue (
    notification_type, 
    channel, 
    recipient, 
    subject, 
    content, 
    metadata, 
    priority
  )
  SELECT 
    'issue_reported',
    'email',
    p.email,
    '[' || UPPER(NEW.severity::TEXT) || '] New Issue: ' || LEFT(NEW.title, 50),
    'A new ' || NEW.severity || ' priority issue has been reported: ' || NEW.title || 
    CASE WHEN NEW.description IS NOT NULL THEN E'\n\nDescription: ' || LEFT(NEW.description, 200) ELSE '' END,
    jsonb_build_object(
      'issue_id', NEW.id, 
      'severity', NEW.severity,
      'title', NEW.title,
      'reporter_email', NEW.reporter_email
    ),
    CASE NEW.severity 
      WHEN 'critical' THEN 'urgent' 
      WHEN 'high' THEN 'high'
      ELSE 'normal' 
    END
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role IN ('admin', 'developer')
    AND p.email IS NOT NULL;

  RETURN NEW;
END;
$$;

-- Create trigger on issues table
CREATE TRIGGER trigger_queue_issue_for_devs
  AFTER INSERT ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_issue_for_devs();