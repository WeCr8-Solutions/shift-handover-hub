# PRD 20: Bug Alert & Notification System — Diagnosis & Improvement Plan

**Status:** Phase 1–3 Complete  
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

### Phase 1: Surface Diagnostic Data in Dev Queue (Priority: Critical) ← IMPLEMENTING

#### 5.1 Component Architecture

```
DevIssueQueue.tsx (refactored)
├── useDevIssueQueue (hook) — list fetching, filtering, CRUD operations
├── useIssueDetail (hook) — single-issue detail with full diagnostic fields
├── DevIssueQueueTable — table rendering (existing, minor changes)
└── IssueDetailDialog (refactored)
    ├── ConsoleLogViewer — filterable, color-coded log viewer
    ├── ErrorStackTrace — collapsible stack trace with copy
    ├── EnvironmentContext — parsed metadata + user agent
    └── Developer Notes (existing)
```

##### 5.1.1 `useIssueDetail` Hook

**Purpose:** Fetch full diagnostic data for a single issue, decoupled from the list query for performance (avoids fetching heavy JSONB columns in list view).

```typescript
// src/hooks/useIssueDetail.ts
interface IssueDetail {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  reporter_display_name: string | null;
  reporter_email: string | null;
  page_url: string | null;
  error_message: string | null;
  error_stack: string | null;         // ← NEW
  console_logs: ConsoleLogEntry[];    // ← NEW
  metadata: Record<string, unknown>;  // ← NEW
  user_agent: string | null;          // ← NEW
  environment: string | null;         // ← NEW
  app_version: string | null;         // ← NEW
  build_id: string | null;            // ← NEW
  commit_hash: string | null;         // ← NEW
  created_at: string;
  organization_id: string | null;
}

function useIssueDetail(issueId: string | null): {
  issue: IssueDetail | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Performance Pattern:** Only fetches when `issueId` is non-null (dialog opened). Uses `useCallback` for stable refetch. No polling — manual refresh via button.

**Security:** Guarded by existing RLS on `issues` table (dev/admin only).

##### 5.1.2 `ConsoleLogViewer` Component

**Purpose:** Render captured console logs with filtering, color coding, and copy support.

```typescript
// src/components/admin/ConsoleLogViewer.tsx
interface ConsoleLogEntry {
  level: "log" | "warn" | "error" | "info" | "debug";
  message: string;
  timestamp: string;
  stack?: string | null;
}

interface ConsoleLogViewerProps {
  logs: ConsoleLogEntry[];
  maxHeight?: number;       // default 300px
  defaultExpanded?: boolean; // default false
}
```

**UI Spec:**
- Collapsible accordion with badge count: "Console Logs (47)"
- Level filter chips: All | Errors (red) | Warnings (amber) | Info (blue) | Debug (gray)
- Each log entry: `[HH:mm:ss.SSS] [LEVEL] message`
- Color-coded by level using semantic tokens
- Stack traces render in nested collapsible `<pre>` blocks
- "Copy All" button → copies filtered logs as plain text
- Virtualized rendering not needed (max 100 logs captured)

**Performance:**
- `useMemo` on filtered logs to avoid re-filtering on every render
- `useCallback` on copy handler
- Lazy mount: only renders when accordion is expanded

##### 5.1.3 `ErrorStackTrace` Component

```typescript
// src/components/admin/ErrorStackTrace.tsx
interface ErrorStackTraceProps {
  errorMessage: string | null;
  errorStack: string | null;
}
```

**UI Spec:**
- Red-tinted alert container with `AlertTriangle` icon
- Error message in bold, stack trace in monospace `<pre>`
- File paths highlighted with subtle underline
- Copy button for full error + stack

##### 5.1.4 `EnvironmentContext` Component

```typescript
// src/components/admin/EnvironmentContext.tsx
interface EnvironmentContextProps {
  metadata: Record<string, unknown> | null;
  userAgent: string | null;
  environment: string | null;
  appVersion: string | null;
  buildId: string | null;
  commitHash: string | null;
}
```

**UI Spec:**
- Grid layout: 2 columns on desktop, 1 on mobile
- Sections: Build Info | Browser/Device | Screen | Locale
- User agent parsed into: Browser (Chrome 120), OS (Windows 11), Device (Desktop)
- `parseUserAgent()` utility — simple regex, no external library
- Monospace badges for version/build/commit

#### 5.2 Performance Optimizations

| Optimization | Technique | Why |
|-------------|-----------|-----|
| Lazy detail fetch | `useIssueDetail` only queries when dialog opens | Avoid fetching heavy JSONB in list view |
| Memoized log filtering | `useMemo(filteredLogs, [logs, levelFilter])` | Re-render only on filter change |
| Stable callbacks | `useCallback` on all handlers passed to child components | Prevent unnecessary child re-renders |
| Accordion lazy mount | ConsoleLogViewer content only mounts when expanded | Zero cost when collapsed |
| Skeleton loading | Show skeleton in dialog while detail loads | Perceived performance |

---

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
- Store in storage bucket `issue-attachments`
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

### Phase 1 — Dev Queue Diagnostic Data ✅ COMPLETE
- [x] Create `useIssueDetail` hook for lazy detail fetching
- [x] Create `ConsoleLogViewer` component with level filtering and copy support
- [x] Create `ErrorStackTrace` component with copy support
- [x] Create `EnvironmentContext` component with user agent parsing
- [x] Integrate all components into `DevIssueQueue` detail dialog
- [ ] Add unit tests for `useIssueDetail` hook
- [ ] Add unit tests for `ConsoleLogViewer` component
- [x] Test with existing issues that have console_logs data

### Phase 2 — Notification Pipeline ✅ COMPLETE
- [x] Audit `notification_queue` table for unprocessed rows (verified: 4 pending)
- [x] Decided notification strategy: Option A — `process-notifications` edge function
- [x] Implement notification processing edge function with Resend
- [x] Add retry logic with exponential backoff (1m, 5m, 15m, 60m, 240m)
- [x] Add rate limiting per recipient (10/hour)
- [x] Add `NotificationQueueStatus` admin panel with "Process" button
- [ ] Clean up orphaned `report-issue` edge function (kept as fallback)
- [x] Test end-to-end: report issue → notification received

### Phase 3 — Reporter Feedback ✅ COMPLETE
- [x] Create `useMyIssues` hook for user's own issue history
- [x] Create `MyIssuesPanel` component with status tracking
- [x] Add "My Issues" tab to Settings page
- [x] Display dev queue status, assigned developer, and notes to reporter
- [ ] Add follow-up comments on reported issues (future)

### Phase 4 — Enhanced Capture
- [ ] Evaluate screenshot capture libraries (bundle size impact)
- [ ] Add optional network request capture
- [ ] Implement duplicate detection on submit
- [ ] Create `issue-attachments` storage bucket with RLS

---

## 7. Database Schema Notes

### Existing Tables (No Changes Needed for Phase 1)
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
| `src/hooks/useIssueDetail.ts` | Lazy detail fetch for single issue | ✅ Working |
| `src/hooks/useMyIssues.ts` | Reporter's own issue history | ✅ NEW |
| `src/components/IssueReportDialog.tsx` | User-facing report form | ✅ Working |
| `src/components/admin/DevIssueQueue.tsx` | Dev triage queue | ✅ UPGRADED |
| `src/components/admin/ConsoleLogViewer.tsx` | Filterable log viewer | ✅ Working |
| `src/components/admin/ErrorStackTrace.tsx` | Stack trace display | ✅ Working |
| `src/components/admin/EnvironmentContext.tsx` | Parsed metadata display | ✅ Working |
| `src/components/admin/NotificationQueueStatus.tsx` | Queue status + manual trigger | ✅ NEW |
| `src/components/settings/MyIssuesPanel.tsx` | Reporter issue history view | ✅ NEW |
| `supabase/functions/process-notifications/index.ts` | Queue processor with Resend | ✅ NEW |
| `supabase/functions/report-issue/index.ts` | Edge function (orphaned fallback) | ⚠️ Not called by client |
| DB trigger: `queue_issue_for_devs()` | Auto-queue + notification insert | ✅ Working |
| DB table: `notification_queue` | Email/push notification backlog | ✅ Processor deployed |

---

## 11. Hook Dependency Map

```
useIssueReporter (existing)
├── Captures: console.*, window.onerror, unhandledrejection
├── Stores: logsRef, errorsRef (useRef for latest-value stability)
├── Sanitizes: JWT, API keys, bearer tokens before storage
└── Submits via: supabase.rpc("report_issue")

useIssueDetail (new)
├── Input: issueId (string | null)
├── Fetches: issues.* with full JSONB columns
├── Pattern: Lazy fetch on non-null ID (dialog open)
├── Caching: None (fresh fetch each open for latest data)
└── Security: RLS-gated (dev/admin only)

useDevIssueQueue (future extraction)
├── Manages: list fetching, filtering, CRUD operations
├── Currently: inline in DevIssueQueue.tsx
└── Candidate for extraction when component grows
```
