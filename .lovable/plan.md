

# AI Planning Assistant Chat Modal

## Overview
Build a floating chat modal accessible to Supervisors and Org Admins that connects to an AI assistant specialized in production planning. The assistant has full context of the organization's queue, stations, routing, and work orders -- enabling it to help leaders make real-time decisions around schedule adjustments, machine downtime rerouting, priority reshuffling, and due-date feasibility.

## What It Does
- Opens as a floating chat button on the Queue and Dashboard pages (visible only to supervisors/org admins)
- Sends the organization's live queue data, station status, and routing info as context to the AI
- Users can ask natural-language questions like:
  - "Machine CNC-3 is down, what work orders are affected and where can I reroute them?"
  - "Can we hit the due date for WO-4521 if we reprioritize?"
  - "Show me all critical items due this week and suggest a plan"
- AI responds with actionable markdown-formatted advice referencing specific work orders, stations, and routing steps

## Technical Details

### 1. Backend Function: `ai-planning-assistant`
Create a new edge function at `supabase/functions/ai-planning-assistant/index.ts` that:
- Accepts conversation messages + organization context
- Queries the database (using service role) for:
  - Active queue items (with station names, assignments, due dates)
  - Station list with active/inactive status
  - Work order routing steps and their completion state
- Builds a system prompt with this live data as context
- Calls the Lovable AI gateway (using `LOVABLE_API_KEY`, model: `openai/gpt-5-mini`) for cost-efficient planning responses
- Returns the AI response as a streamed or complete message

### 2. New Database Table: `planning_chat_sessions`
Store conversation history so users can resume planning sessions:
- `id` (uuid, PK)
- `organization_id` (uuid, FK to organizations)
- `user_id` (uuid, references auth.users)
- `title` (text, auto-generated from first message)
- `messages` (jsonb array of `{role, content, timestamp}`)
- `created_at`, `updated_at` (timestamptz)

RLS policies:
- Users can only read/write their own sessions within their organization
- Supervisors and org admins only (enforced via `is_org_admin` or `is_supervisor_in_org` checks)

### 3. Frontend Component: `PlanningAssistantModal`
New file: `src/components/queue/PlanningAssistantModal.tsx`
- Floating action button (bottom-right) with a "brain" or "sparkles" icon
- Opens a slide-up dialog/drawer with:
  - Chat message history (rendered with markdown support)
  - Text input for user messages
  - Loading indicator while AI responds
  - Quick-prompt buttons for common scenarios: "Machine Down", "Reprioritize Queue", "Due Date Check"
- Gated behind `hasOrgAdminAccess || hasOrgSupervisorAccess` from `useAdminAccess`

### 4. Custom Hook: `usePlanningAssistant`
New file: `src/hooks/usePlanningAssistant.ts`
- Manages chat state (messages, loading, session persistence)
- Calls the edge function with full message history
- Saves/loads sessions from `planning_chat_sessions` table
- Provides `sendMessage`, `clearChat`, `loadSession` methods

### 5. Integration Points
- Add the floating button to `src/pages/Queue.tsx` and `src/pages/Index.tsx` (dashboard)
- Only render when user has supervisor or org admin access
- Pass `organization_id` for data scoping

### Files to Create
- `supabase/functions/ai-planning-assistant/index.ts` -- Edge function
- `src/components/queue/PlanningAssistantModal.tsx` -- Chat UI modal
- `src/hooks/usePlanningAssistant.ts` -- Chat state hook
- Migration SQL for `planning_chat_sessions` table + RLS policies

### Files to Modify
- `src/pages/Queue.tsx` -- Add floating assistant button
- `src/pages/Index.tsx` -- Add floating assistant button
- `src/components/queue/index.ts` -- Export new component

