# PRD 20: Bug Alert & Notification System — Diagnosis & Improvement Plan

**Status:** Draft  
**Last Updated:** 2026-03-08  
**Owner:** Platform Dev Team

---

## 1. Executive Summary

The bug/issue reporting system captures user console logs, runtime errors, and production context at submission time, but **fails to surface this diagnostic data** to developers during triage and resolution. Additionally, the notification pipeline has a broken link: the client-side code path (RPC `report_issue`) triggers database-level email queuing into `notification_queue`, but **no processor exists** to deliver those queued notifications.

---

## 2. Current Architecture

### 2.1 Data Flow

```
User hits bug → IssueReportDialog (UI)
  → useIssueReporter hook (captures console logs, runtime errors, page URL, metadata)
    → supabase.rpc("report_issue") — DB function
      → INSERT into `issues` table (with console_logs, error_stack, metadata)
      → TRIGGER: queue_issue_for_devs()
        → INSERT into `dev_issue_queue` (auto-queue for triage)
        → INSERT into `notification_queue` (email notification for admins/devs)
          → ❌ NO PROCESSOR — emails never sent
```

### 2.2 Parallel (Unused) Path

```
Edge Function: report-issue/index.ts
  → INSERT into `issues` table
  → Resend email directly to admin/dev profiles
  → Webhook notification (if ISSUES_WEBHOOK_URL configured)
  ⚠️ NOT CALLED by the client — client uses RPC instead
```

### 2.3 Dev Queue Viewing

```
DevIssueQueue.tsx
  → SELECT from dev_issue_queue JOIN issues
  → ❌ Does NOT fetch: console_logs, error_stack, metadata, user_agent
  → Detail dialog shows: title, description, error_message, page_url
  → ❌ Missing: console_logs viewer, error_stack trace, environment info, user agent
```

---

## 3. Diagnosed Issues

### 🔴 Critical

| # | Issue | Impact |
|---|-------|--------|
| C1 | **Notification queue has no processor** — `queue_issue_for_devs` trigger inserts into `notification_queue` but no edge function or cron processes it | Admins/devs never receive email alerts for new issues |
| C2 | **Console logs captured but never displayed** — `issues.console_logs` column is populated but DevIssueQueue detail dialog doesn't query or render it | Devs lose the most valuable diagnostic data |
| C3 | **Error stack not shown** — `issues.error_stack` exists but isn't fetched or displayed in the dev queue | Stack traces unavailable for debugging |

### 🟡 Important

| # | Issue | Impact |
|---|-------|--------|
| I1 | **Metadata not surfaced** — screen size, timezone, language, environment, build info stored but not shown | Context for reproducing bugs is hidden |
| I2 | **User agent not displayed** — browser/device info captured but not visible in dev queue | Can't identify browser-specific issues |
| I3 | **Edge function `report-issue` is orphaned** — exists but client uses RPC path instead | Dead code; dual notification logic creates confusion |
| I4 | **No notification delivery confirmation** — no way to verify if issue notifications were received | Silent failures in alerting |

### 🔵 Nice-to-Have

| # | Issue | Impact |
|---|-------|--------|
| N1 | No screenshot/attachment support in issue reports | Visual bugs hard to describe in text |
| N2 | No issue status change notifications | Reporter doesn't know when their bug is being worked on |
| N3 | No duplicate detection | Same error can be reported multiple times |
| N4 | Console log viewer lacks syntax highlighting | Harder to scan logs quickly |

---

## 4. Data Already Captured (Working Correctly ✅)

The `useIssueReporter` hook correctly captures:

| Data Point | Source | Stored In |
|-----------|--------|-----------|
| Console logs (log/warn/error/info/debug) | Monkey-patched `console.*` | `issues.console_logs` (JSONB) |
| Runtime errors + unhandled rejections | `window.onerror` / `onunhandledrejection` | `issues.error_message`, `issues.error_stack` |
| Current page URL | `window.location.href` | `issues.page_url` |
| App version, build ID, commit hash | `import.meta.env` | `issues.app_version`, `issues.build_id`, `issues.commit_hash` |
| Screen dimensions | `window.innerWidth/Height` | `issues.metadata` |
| Timezone, language, user agent | `navigator.*` / `Intl.*` | `issues.metadata`, `issues.user_agent` |
| Reporter identity | Auth context | `issues.reporter_id`, `issues.reporter_email`, `issues.reporter_display_name` |
| Organization context | `organization_members` lookup | `issues.organization_id` |
| Secret redaction | Regex sanitization (JWT, API keys, bearer tokens) | Applied before storage |

---

## 5. Improvement Plan

### Phase 1: Surface Diagnostic Data in Dev Queue (Priority: Critical)

#### 5.1 Expand DevIssueQueue Query
- Add `console_logs`, `error_stack`, `metadata`, `user_agent`, `environment`, `app_version`, `build_id`, `commit_hash` to the issues JOIN select

#### 5.2 Console Log Viewer Component
- Create `<ConsoleLogViewer logs={issue.console_logs} />` component
- Color-coded by level: error (red), warn (amber), info (blue), log (gray), debug (muted)
- Collapsible with count badge
- Filterable by level
- Copy-all button for pasting into dev tools
- Timestamp display (relative or absolute toggle)

#### 5.3 Error Stack Trace Panel
- Render `error_stack` in a `<pre>` block with monospace font
- Highlight file paths and line numbers
- Copy button

#### 5.4 Environment Context Panel
- Show: app version, build ID, commit hash, environment
- Show: screen dimensions, timezone, language, user agent
- Parse user agent into readable format (browser name + version, OS)

### Phase 2: Fix Notification Pipeline (Priority: Critical)

#### 5.5 Decide Notification Strategy
**Option A (Recommended):** Remove the edge function `report-issue` (orphaned). Enhance the `queue_issue_for_devs` trigger to use a new edge function that processes `notification_queue`.

**Option B:** Switch client to use the edge function instead of RPC, and remove the trigger-based notification queuing.

**Option C:** Create a `process-notifications` edge function called via pg_cron or webhook to drain `notification_queue`.

#### 5.6 Notification Processing Edge Function
- Create `process-notifications/index.ts`
- Query `notification_queue` WHERE `status = 'pending'` AND `scheduled_for <= now()`
- Send via Resend (email channel)
- Update status to `sent` or `failed` with error details
- Respect `max_attempts` and exponential backoff
- Rate limit per recipient

#### 5.7 Notification Delivery Tracking
- Add `notification_queue.delivered_at` tracking
- Surface delivery status in admin panel
- Alert if notifications consistently fail

### Phase 3: Reporter Feedback Loop (Priority: Important)

#### 5.8 Status Change Notifications
- When dev updates `dev_issue_queue.status`, notify the reporter
- Channels: in-app notification + optional email
- Include: new status, developer notes (if any), resolution summary

#### 5.9 Issue Detail Page for Reporters
- Allow reporters to view their submitted issues and current status
- Show: status, assigned developer (name only), resolution notes
- Allow adding follow-up comments

### Phase 4: Enhanced Capture (Priority: Nice-to-Have)

#### 5.10 Screenshot Support
- Add optional screenshot capture using `html2canvas` or browser screenshot API
- Store in Supabase Storage bucket `issue-attachments`
- Display in dev queue detail view

#### 5.11 Duplicate Detection
- On submit, check for similar titles (fuzzy match) within last 7 days
- Warn reporter: "A similar issue was reported X days ago"
- Allow linking as duplicate in dev queue

#### 5.12 Network Request Capture
- Optionally capture failed network requests (4xx/5xx) via `PerformanceObserver` or fetch wrapper
- Store sanitized request/response metadata (no bodies with PII)
- Display in dev queue alongside console logs

---

## 6. Implementation Checklist

### Phase 1 — Dev Queue Diagnostic Data
- [ ] Expand `DevIssueQueue` select query to include all diagnostic fields from `issues`
- [ ] Create `ConsoleLogViewer` component with level filtering and copy support
- [ ] Add error stack trace panel to issue detail dialog
- [ ] Add environment/metadata context panel to issue detail dialog
- [ ] Parse and display user agent in readable format
- [ ] Test with existing issues that have console_logs data

### Phase 2 — Notification Pipeline
- [ ] Audit `notification_queue` table for unprocessed rows (verify the gap)
- [ ] Decide notification strategy (Option A/B/C above)
- [ ] Implement notification processing edge function
- [ ] Add retry logic with exponential backoff
- [ ] Add rate limiting per recipient
- [ ] Clean up orphaned `report-issue` edge function (if Option A chosen)
- [ ] Add notification delivery status to admin panel
- [ ] Test end-to-end: report issue → notification received

### Phase 3 — Reporter Feedback
- [ ] Add status change notification trigger
- [ ] Create reporter issue history view (Settings or Profile page)
- [ ] Allow follow-up comments on reported issues

### Phase 4 — Enhanced Capture
- [ ] Evaluate screenshot capture libraries (bundle size impact)
- [ ] Add optional network request capture
- [ ] Implement duplicate detection on submit
- [ ] Create `issue-attachments` storage bucket with RLS

---

## 7. Database Schema Notes

### Existing Tables (No Changes Needed)
- `issues` — Already has all needed columns (`console_logs`, `error_stack`, `metadata`, `user_agent`, etc.)
- `dev_issue_queue` — Properly linked via `issue_id` FK
- `notification_queue` — Schema supports email/push channels with retry tracking

### Potential Schema Additions (Phase 3+)
```sql
-- Issue comments for reporter follow-ups
CREATE TABLE public.issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_display_name TEXT,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- dev-only notes vs visible to reporter
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Issue attachments
CREATE TABLE public.issue_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. Security Considerations

- Console logs are sanitized for JWTs, API keys, bearer tokens, and passwords before storage ✅
- Error stacks may contain file paths — acceptable for internal dev viewing
- Reporter should NOT see internal dev notes (use `is_internal` flag on comments)
- Notification queue should not expose email addresses in client-accessible queries
- Issue attachments need RLS: reporter can upload to own issues, devs can view all

---

## 9. Metrics & Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Console logs visible to devs in queue | 0% | 100% |
| Issues with email notification delivered | 0% (broken) | 95%+ |
| Mean time to first dev response | Unknown | < 4 hours (critical), < 24h (others) |
| Issues resolved with console log context | N/A | Track % using logs vs not |

---

## 10. File Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/hooks/useIssueReporter.ts` | Client-side log capture & RPC call | ✅ Working |
| `src/components/IssueReportDialog.tsx` | User-facing report form | ✅ Working |
| `src/components/admin/DevIssueQueue.tsx` | Dev triage queue | ⚠️ Missing diagnostic display |
| `supabase/functions/report-issue/index.ts` | Edge function (orphaned) | ⚠️ Not called by client |
| DB trigger: `queue_issue_for_devs()` | Auto-queue + notification insert | ⚠️ Notifications not processed |
| DB table: `notification_queue` | Email/push notification backlog | ❌ No processor |
