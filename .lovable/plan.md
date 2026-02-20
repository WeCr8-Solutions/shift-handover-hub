

# AI Chat Usage Limits for Free Users

## Overview
Allow org owners to use the AI Planning Assistant chat modal, but enforce a daily message limit for non-paying (free plan) users and show upgrade prompts when they hit the limit.

## How It Works

### Usage Tracking
- Create a new `ai_chat_usage` table to track daily message counts per organization
- The edge function checks the org's plan and current day's usage before processing
- Free plan: **5 messages per day**
- Single plan: **25 messages per day**
- Team plan: **100 messages per day**
- Enterprise: **Unlimited**

### User Experience
- A small usage counter badge shows remaining messages in the chat header (e.g., "3/5 left")
- When the limit is reached, the input is disabled and replaced with an upgrade prompt card
- The upgrade card shows a "Upgrade Plan" button that triggers the checkout flow
- Usage resets daily at midnight UTC

## Technical Details

### 1. Database Migration -- `ai_chat_usage` table

```sql
CREATE TABLE public.ai_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, usage_date)
);

ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Org members can read their own org's usage
CREATE POLICY "Org members can view AI usage"
  ON public.ai_chat_usage FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- Only service role / edge function increments (no direct user writes)
```

A database function `increment_ai_chat_usage` will atomically increment the count and return the new total + daily limit based on the org's plan.

### 2. Edge Function Update -- `ai-planning-assistant`

Before calling the AI gateway, the function will:
1. Look up the org's entitlement plan
2. Check `ai_chat_usage` for today's count
3. If over limit, return a `429` with a clear `"limit_reached"` error and remaining info
4. If under limit, increment the counter and proceed

### 3. Frontend -- `PlanningAssistantModal.tsx`

- Add a `useAiChatUsage` hook that queries `ai_chat_usage` for today's count and the plan's limit
- Show a usage badge in the sheet header: "3 of 5 messages today"
- When limit reached:
  - Disable the input and send button
  - Show an inline upgrade card with plan pricing and a checkout button
- Handle the `429 limit_reached` response from the edge function gracefully with a toast

### 4. Files Changed

| File | Change |
|------|--------|
| New migration SQL | Create `ai_chat_usage` table + `increment_ai_chat_usage()` function + RLS |
| `supabase/functions/ai-planning-assistant/index.ts` | Add usage check + increment before AI call |
| `src/hooks/useAiChatUsage.ts` (new) | Hook to fetch today's usage count and daily limit |
| `src/components/queue/PlanningAssistantModal.tsx` | Add usage counter badge, limit-reached upgrade card, disable input when exhausted |
| `src/hooks/usePlanningAssistant.ts` | Handle `429` limit-reached response specifically |

