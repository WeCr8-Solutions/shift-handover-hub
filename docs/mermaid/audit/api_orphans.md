# API Orphan Report — Edge Functions & RPC

Edge functions and RPC functions with **no frontend caller** or **no clear invocation path**.
Updated: 2026-03-08

## Edge Functions

| Function | Has FE Caller | Invocation | Orphan? | Notes |
|----------|--------------|------------|---------|-------|
| `activate-station-context` | Yes | StationMachineContextDialog | No | — |
| `ai-planning-assistant` | Yes | usePlanningAssistant hook | No | — |
| `auth-email-hook` | No (System) | Supabase Auth system hook | No | Triggered by auth events, not FE |
| `check-subscription` | Yes | useSubscription hook | No | — |
| `create-checkout` | Yes | BillingSettings | No | — |
| `create-donation` | Yes | Pricing/Landing | No | — |
| `customer-portal` | Yes | BillingSettings | No | — |
| `erp-sync` | Yes | useERPConnector hook | No | — |
| `report-issue` | Yes | useIssueReporter hook | No | — |
| `rls-health` | Yes | RLSHealthCheck component | No | — |
| `send-email` | Yes | useEmail hook | No | — |
| `social-agent` | **Unclear** | Admin panel? | **Potential** | Medium |
| `stripe-webhook` | No (Webhook) | Stripe webhook delivery | No | External trigger |
| `update-seats` | Yes | Settings/subscription | No | — |
| `verify-station-context-payment` | Yes | StationMachineContextDialog | No | — |

## Database RPC Functions

| Function | Has FE Caller | Called By | Orphan? | Notes |
|----------|--------------|----------|---------|-------|
| `compute_smart_alerts` | Yes | useSmartAlerts (React Query) | No | Server-side alert computation — replaces 8 client queries |
| `apply_ncr_disposition` | Yes | useNCR | No | — |
| `reject_ncr` | Yes | useNCR | No | — |
| `pass_work_order_to_next_step` | Yes | useQueue / operator workflow | No | — |
| `validate_invite_code` | Yes | useOrganizationInvites | No | — |
| `validate_display_token` | Yes | ShopFloorDisplay page | No | — |
| `report_issue` | Yes | useIssueReporter (also edge fn) | No | — |
| `increment_ai_chat_usage` | Yes | useAiChatUsage | No | — |
| `increment_erp_sync_usage` | Yes | useERPConnector | No | — |
| `reorder_queue_item` | Yes | useQueue | No | — |
| `can_act_as` | Yes | ActAsContext | No | — |

## Missing Endpoints (FE calls with no edge function)

| Frontend Feature | Expected Endpoint | Status | Severity |
|-----------------|-------------------|--------|----------|
| Bulk upload (Excel) | Client-side only | OK | — |
| Work order export | Client-side only | OK | — |
| NCR approval | Uses RPC `apply_ncr_disposition` | OK | — |
| NCR rejection | Uses RPC `reject_ncr` | OK | — |
| Pass WO to next step | Uses RPC `pass_work_order_to_next_step` | OK | — |
| Smart alerts | Uses RPC `compute_smart_alerts` | OK | — |

## Summary
- **1 potential orphan**: `social-agent` — verify frontend usage or document as internal-only
- **0 missing endpoints** — all FE features have corresponding backend paths (direct DB, RPC, or edge function)
- All webhook/system functions are correctly marked as non-FE-triggered
- All 11 RPC functions have confirmed frontend callers

## Recommendations
1. Verify `social-agent` has an active frontend caller or document as admin-only tool
2. Consider adding health check endpoints for monitoring
