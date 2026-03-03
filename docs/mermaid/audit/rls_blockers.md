# RLS Blockers Report — UI Writes vs Policy Gaps

Cases where the **UI expects a write operation** but **RLS policies may block it**.

## Analysis Method
Cross-referenced sequence diagrams and UI components against actual `pg_policies` output.

## Findings

| Table | UI Operation | Role Expected | RLS Policy Exists | Blocker? | Severity |
|-------|-------------|---------------|-------------------|----------|----------|
| `queue_items` | INSERT (Create WO) | org member | Yes (`Org members can create queue items`) | No | — |
| `queue_items` | UPDATE (status change) | org member | Yes (`Org members can update own org items`) | No | — |
| `handoff_records` | INSERT | org member | Yes (`Org members can insert handoffs`) | No | — |
| `current_station_status` | UPSERT | org member | Yes (INSERT + UPDATE policies) | No | — |
| `operator_station_sessions` | INSERT (check-in) | org member | Yes (`Operators can insert own sessions`) | No | — |
| `ncr_reports` | INSERT | org member | Yes (`Org members can create NCRs`) | No | — |
| `activity_logs` | INSERT | authenticated | Yes (`Users can insert own activity logs`) | No | — |
| `data_access_logs` | INSERT | authenticated | Yes (`Users can insert own access logs`) | No | — |
| `ai_chat_usage` | INSERT/UPDATE | system (RPC) | Via `increment_ai_chat_usage` RPC (SECURITY DEFINER) | No | — |
| `stations` | INSERT | team admin | Yes (`Team admins can create stations`) | No | — |
| `departments` | INSERT | team admin | Yes (`Team admins can create departments in org`) | No | — |
| `announcements` | INSERT | supervisor | Yes (`Supervisors can create announcements`) | No | — |
| `app_settings` | UPDATE | org admin | Yes (`Org admins and supervisors can manage org settings`) | No | — |
| `equipment` | INSERT/UPDATE | org admin OR supervisor | Yes (both policies exist) | No | — |
| `downtime_events` | INSERT | org member | Yes (`Org members can report downtime`) | No | — |
| `delivery_requests` | INSERT | org member | Yes (`Org members can create deliveries`) | No | — |

## Tables Without INSERT Policies (Potential Blockers)

| Table | Has RLS Enabled | INSERT Policy | Write Expected from UI? | Risk |
|-------|----------------|---------------|------------------------|------|
| `entitlements` | Yes | No INSERT policy (auto-created via trigger) | No (system-managed) | None |
| `subscriptions` | Yes | No INSERT from FE (webhook-managed) | No | None |
| `stripe_events` | Yes | No INSERT from FE (webhook-managed) | No | None |
| `email_rate_limits` | Yes | Service role only | No (edge function) | None |
| `changelogs` | Yes | dev/admin only | Yes (admin panel) | None |
| `rls_health_checks` | Yes | Unclear | Via edge function | Low |

## Summary
- **0 critical RLS blockers** — all UI write operations have matching RLS policies
- All system-managed tables correctly restrict to service role or SECURITY DEFINER functions
- Trigger-based auto-population (org_id) prevents common insert failures

## Recommendations
1. Verify `rls_health_checks` INSERT policy covers the edge function's service role
2. Periodically run the RLS health check edge function to validate policy coverage
