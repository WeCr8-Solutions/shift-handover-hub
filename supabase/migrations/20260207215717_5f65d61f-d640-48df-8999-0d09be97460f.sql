-- Create issue status enum
CREATE TYPE public.issue_status AS ENUM ('open', 'investigating', 'in_progress', 'resolved', 'closed', 'wont_fix');

-- Create issue severity enum
CREATE TYPE public.issue_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Create issues table for in-app error reporting
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reporter info
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reporter_display_name TEXT,
  
  -- Issue details
  title TEXT NOT NULL,
  description TEXT,
  severity issue_severity NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'open',
  
  -- Error context
  error_message TEXT,
  error_stack TEXT,
  console_logs JSONB DEFAULT '[]'::jsonb,
  
  -- Production context
  environment TEXT DEFAULT 'production',
  app_version TEXT,
  build_id TEXT,
  commit_hash TEXT,
  user_agent TEXT,
  page_url TEXT,
  
  -- Assignment & resolution
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Organization context (optional)
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_severity ON public.issues(severity);
CREATE INDEX idx_issues_reporter ON public.issues(reporter_id);
CREATE INDEX idx_issues_assigned ON public.issues(assigned_to);
CREATE INDEX idx_issues_created ON public.issues(created_at DESC);
CREATE INDEX idx_issues_organization ON public.issues(organization_id);

-- Enable RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert issues (report bugs)
CREATE POLICY "Authenticated users can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
);

-- Policy: Platform admins and developers can read all issues
CREATE POLICY "Admins and developers can read all issues"
ON public.issues
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer')
);

-- Policy: Reporters can read their own issues
CREATE POLICY "Reporters can read own issues"
ON public.issues
FOR SELECT
TO authenticated
USING (
  auth.uid() = reporter_id
);

-- Policy: Platform admins and developers can update any issue
CREATE POLICY "Admins and developers can update issues"
ON public.issues
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer')
);

-- Policy: Platform admins can delete issues
CREATE POLICY "Admins can delete issues"
ON public.issues
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
);

-- Create trigger for updated_at
CREATE TRIGGER update_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create RLS health check results table for logging test runs
CREATE TABLE public.rls_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'select', 'insert', 'update', 'delete'
  expected_result TEXT NOT NULL, -- 'allow', 'deny'
  actual_result TEXT NOT NULL, -- 'allow', 'deny', 'error'
  passed BOOLEAN NOT NULL,
  error_message TEXT,
  execution_time_ms INTEGER,
  run_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by run
CREATE INDEX idx_rls_health_checks_run ON public.rls_health_checks(run_id, created_at DESC);

-- Enable RLS on health checks table
ALTER TABLE public.rls_health_checks ENABLE ROW LEVEL SECURITY;

-- Only admins and developers can access RLS health checks
CREATE POLICY "Admins and developers can manage RLS health checks"
ON public.rls_health_checks
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer')
);