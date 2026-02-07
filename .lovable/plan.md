

# Fast Issue Reporting with Database Function & Dev Queue

## Overview

This plan converts issue reporting from Edge Function-based to a high-performance **database function** approach, and adds a **developer work queue** system for issue triage and resolution tracking.

## Current State

| Component | Current Implementation |
|-----------|----------------------|
| Issue Submission | Edge Function `report-issue` (HTTP roundtrip ~200-500ms) |
| Storage | `issues` table with RLS |
| Notifications | Email via Resend + Webhook (in Edge Function) |
| Dev Workflow | Manual triage in Admin → Issues tab |

## Proposed Changes

### 1. Database Function for Fast Issue Creation

Create a `SECURITY DEFINER` PostgreSQL function that:
- Accepts issue data directly from the client
- Auto-populates reporter info from `auth.uid()`
- Creates the issue in a single database call (~10-50ms)
- Triggers async notification via database event

```text
report_issue(
  _title TEXT,
  _description TEXT,
  _severity issue_severity,
  _error_message TEXT,
  _error_stack TEXT,
  _console_logs JSONB,
  _page_url TEXT,
  _metadata JSONB
) RETURNS UUID
```

### 2. Developer Issue Queue Table

Create `dev_issue_queue` table to track developer assignments and progress:

```text
dev_issue_queue
├── id (UUID)
├── issue_id (FK → issues)
├── assigned_developer_id (FK → auth.users)
├── priority (1-5, higher = more urgent)
├── queue_position (INTEGER, for ordering)
├── estimated_effort (TEXT: quick_fix, medium, complex)
├── started_at (TIMESTAMPTZ)
├── completed_at (TIMESTAMPTZ)
├── time_spent_minutes (INTEGER)
└── notes (TEXT)
```

### 3. Async Notification Trigger

Use a database trigger on `issues` INSERT to:
- Queue notification in `notification_queue` table
- Edge Function or pg_cron can process the queue
- Ensures notifications even if client disconnects

### 4. Updated Frontend Hook

Modify `useIssueReporter.ts` to call the database function directly:

```text
Before: supabase.functions.invoke("report-issue", { body: payload })
After:  supabase.rpc("report_issue", { ... params })
```

## Architecture

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User clicks   │────►│  report_issue() │────►│  issues table   │
│   "Report Bug"  │     │   DB Function   │     │                 │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 │                       ▼
                                 │              ┌─────────────────┐
                                 │              │   DB Trigger    │
                                 │              │ on INSERT issue │
                                 │              └────────┬────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │ dev_issue_queue │     │notification_queue│
                        │  (auto-create)  │     │  (for email)    │
                        └─────────────────┘     └─────────────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │ Admin Dashboard │     │  Edge Function  │
                        │  Dev Queue View │     │  sends emails   │
                        └─────────────────┘     └─────────────────┘
```

## Performance Comparison

| Metric | Edge Function | DB Function |
|--------|---------------|-------------|
| Latency | ~200-500ms | ~10-50ms |
| Cold starts | Possible | None |
| Reliability | HTTP-dependent | Direct to DB |
| Notification | Sync (blocks) | Async (trigger) |

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Migration file | Create | DB function `report_issue`, trigger, `dev_issue_queue` table |
| `src/hooks/useIssueReporter.ts` | Modify | Switch to `supabase.rpc()` call |
| `src/components/admin/DevIssueQueue.tsx` | Create | Queue management UI for developers |
| `src/pages/Admin.tsx` | Modify | Add "Dev Queue" tab |
| `supabase/functions/process-issue-notifications/` | Create | Process notification queue |

---

## Technical Details

### Database Function: `report_issue`

```sql
CREATE OR REPLACE FUNCTION public.report_issue(
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _severity issue_severity DEFAULT 'medium',
  _error_message TEXT DEFAULT NULL,
  _error_stack TEXT DEFAULT NULL,
  _console_logs JSONB DEFAULT '[]',
  _page_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
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
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get profile info
  SELECT display_name, email INTO _profile
  FROM profiles WHERE user_id = _user_id;

  -- Get organization
  SELECT organization_id INTO _org_id
  FROM organization_members WHERE user_id = _user_id LIMIT 1;

  -- Insert issue
  INSERT INTO issues (
    reporter_id, reporter_email, reporter_display_name,
    title, description, severity,
    error_message, error_stack, console_logs,
    page_url, organization_id, metadata
  ) VALUES (
    _user_id, _profile.email, _profile.display_name,
    _title, _description, _severity,
    _error_message, _error_stack, _console_logs,
    _page_url, _org_id, _metadata
  )
  RETURNING id INTO _issue_id;

  RETURN _issue_id;
END;
$$;
```

### Database Trigger for Queue + Notification

```sql
CREATE OR REPLACE FUNCTION queue_issue_for_devs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _priority INT;
BEGIN
  -- Calculate priority based on severity
  _priority := CASE NEW.severity
    WHEN 'critical' THEN 5
    WHEN 'high' THEN 4
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 2
    ELSE 1
  END;

  -- Auto-add to dev queue
  INSERT INTO dev_issue_queue (issue_id, priority, queue_position)
  VALUES (NEW.id, _priority, 
    COALESCE((SELECT MAX(queue_position) + 1 FROM dev_issue_queue), 1));

  -- Queue email notification
  INSERT INTO notification_queue (
    notification_type, channel, recipient, subject, content, metadata, priority
  )
  SELECT 
    'email', 'issue', p.email,
    '[' || UPPER(NEW.severity::TEXT) || '] New Issue: ' || NEW.title,
    'A new issue has been reported: ' || NEW.title,
    jsonb_build_object('issue_id', NEW.id, 'severity', NEW.severity),
    CASE NEW.severity WHEN 'critical' THEN 'urgent' ELSE 'normal' END
  FROM user_roles ur
  JOIN profiles p ON p.user_id = ur.user_id
  WHERE ur.role IN ('admin', 'developer')
  AND p.email IS NOT NULL;

  RETURN NEW;
END;
$$;
```

### Dev Issue Queue Table

```sql
CREATE TABLE public.dev_issue_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  assigned_developer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  queue_position INTEGER NOT NULL,
  estimated_effort TEXT CHECK (estimated_effort IN ('quick_fix', 'medium', 'complex')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(issue_id)
);

-- RLS: Only admins/developers can access
CREATE POLICY "Devs can manage queue"
ON dev_issue_queue FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));
```

### Updated useIssueReporter Hook

```typescript
const reportIssue = useCallback(async (report: IssueReport) => {
  // Direct RPC call - much faster than Edge Function
  const { data, error } = await supabase.rpc("report_issue", {
    _title: report.title,
    _description: report.description,
    _severity: report.severity || "medium",
    _error_message: latestError?.message,
    _error_stack: latestError?.stack,
    _console_logs: report.includeConsoleLogs !== false ? logsRef.current.slice(-50) : [],
    _page_url: report.includePage !== false ? window.location.href : null,
    _metadata: { ...PRODUCTION_CONTEXT, ... }
  });
  
  if (error) throw error;
  return { success: true, issue_id: data };
}, [user]);
```

### Dev Queue UI Component

A new `DevIssueQueue.tsx` component showing:
- Kanban or list view of queued issues
- Drag-and-drop priority reordering
- "Claim" button to assign to self
- Time tracking (start/stop timer)
- Effort estimation selector
- Quick status updates

---

## Security Considerations

1. **SECURITY DEFINER** function runs with elevated privileges but validates `auth.uid()`
2. RLS on `dev_issue_queue` restricts access to admin/developer roles
3. Notification queue uses existing RLS policies
4. No sensitive data exposed - function only accepts user input, enriches server-side

## Migration Safety

- Non-destructive: adds new function and table
- Existing `report-issue` Edge Function remains functional (can be deprecated later)
- Backward compatible - old clients will still work

