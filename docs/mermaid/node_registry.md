# Node Registry — JobLine.ai

All diagram nodes must reference a real entity listed here.

## Frontend Routes (FE_ROUTE)

| Node ID | Path | Component | Auth Required | Role Gate |
|---------|------|-----------|---------------|-----------|
| FE_ROUTE__landing | `/` | Landing | No | None |
| FE_ROUTE__dashboard | `/dashboard` | Index | Yes | Any |
| FE_ROUTE__auth | `/auth` | Auth | No | None |
| FE_ROUTE__reset_password | `/reset-password` | ResetPassword | No | None |
| FE_ROUTE__teams | `/teams` | Teams | Yes | Any |
| FE_ROUTE__profile | `/profile` | Profile | Yes | Any |
| FE_ROUTE__admin | `/admin` | Admin | Yes | admin |
| FE_ROUTE__testing | `/testing` | Testing | Yes | admin, developer |
| FE_ROUTE__queue | `/queue` | Queue | Yes | Any |
| FE_ROUTE__setup | `/setup` | Setup | Yes | Any |
| FE_ROUTE__pricing | `/pricing` | Pricing | No | None |
| FE_ROUTE__settings | `/settings` | Settings | Yes | Any |
| FE_ROUTE__donation_success | `/donation-success` | DonationSuccess | No | None |
| FE_ROUTE__demo | `/demo` | Demo | No | None |
| FE_ROUTE__updates | `/updates` | Updates | Yes | Any |
| FE_ROUTE__start | `/start` | Start | No | None |
| FE_ROUTE__zach | `/zach` | FounderRedirect | No | None |
| FE_ROUTE__feat_shift_handoff | `/features/shift-handoff-software` | ShiftHandoffSoftware | No | None |
| FE_ROUTE__feat_wo_tracking | `/features/work-order-tracking` | WorkOrderTracking | No | None |
| FE_ROUTE__feat_prod_scheduling | `/features/production-scheduling` | ProductionScheduling | No | None |
| FE_ROUTE__feat_machine_shop | `/features/machine-shop-software` | MachineShopSoftware | No | None |
| FE_ROUTE__feat_prod_control | `/features/production-control` | ProductionControl | No | None |
| FE_ROUTE__feat_digital_expeditor | `/features/digital-expeditor` | DigitalExpeditor | No | None |
| FE_ROUTE__feat_mfg_oversight | `/features/manufacturing-oversight` | ManufacturingOversight | No | None |
| FE_ROUTE__feat_quality | `/features/quality-management` | QualityManagement | No | None |
| FE_ROUTE__feat_cnc | `/features/cnc-operator-tools` | CNCOperatorTools | No | None |
| FE_ROUTE__feat_team_collab | `/features/team-collaboration` | TeamCollaboration | No | None |
| FE_ROUTE__feat_downtime | `/features/downtime-tracking` | DowntimeTracking | No | None |
| FE_ROUTE__feat_ai_planning | `/features/ai-planning-assistant` | AIPlanningAssistant | No | None |
| FE_ROUTE__machine_time | `/machine-time-tracking` | MachineTimeTracking | No | None |
| FE_ROUTE__shift_handoff | `/shift-handoff` | ShiftHandoff | No | None |
| FE_ROUTE__mfg_visibility | `/manufacturing-visibility` | ManufacturingVisibility | No | None |
| FE_ROUTE__not_found | `*` | NotFound | No | None |

## Edge Functions (API)

| Node ID | Function Name | Method | Auth | Tables Touched |
|---------|--------------|--------|------|----------------|
| API__fn__activate_station_context | activate-station-context | POST | Yes | stations, station_machine_assignments |
| API__fn__ai_planning_assistant | ai-planning-assistant | POST | Yes | planning_chat_sessions, queue_items |
| API__fn__auth_email_hook | auth-email-hook | POST | System | (email sending) |
| API__fn__check_subscription | check-subscription | POST | Yes | subscriptions, entitlements |
| API__fn__create_checkout | create-checkout | POST | Yes | organizations, subscriptions |
| API__fn__create_donation | create-donation | POST | No | (Stripe) |
| API__fn__customer_portal | customer-portal | POST | Yes | organizations |
| API__fn__erp_sync | erp-sync | POST | Yes | erp_connections, erp_sync_logs, queue_items |
| API__fn__report_issue | report-issue | POST | Yes | issues |
| API__fn__rls_health | rls-health | POST | Yes | rls_health_checks |
| API__fn__send_email | send-email | POST | Yes | email_rate_limits |
| API__fn__social_agent | social-agent | POST | Yes | (AI) |
| API__fn__stripe_webhook | stripe-webhook | POST | Webhook | stripe_events, subscriptions, organizations |
| API__fn__update_seats | update-seats | POST | Yes | organization_members, subscriptions |
| API__fn__verify_station_context | verify-station-context-payment | POST | Yes | organization_machine_purchases |

## Database Tables (DB) — 80 tables

| Node ID | Table | Org-Scoped | Core Domain |
|---------|-------|------------|-------------|
| DB__organizations | organizations | Root | Tenancy |
| DB__organization_members | organization_members | Yes | Tenancy |
| DB__teams | teams | Yes | Tenancy |
| DB__team_members | team_members | Via team | Tenancy |
| DB__profiles | profiles | No (user) | Identity |
| DB__user_roles | user_roles | No (user) | Identity |
| DB__stations | stations | Yes | Production |
| DB__queue_items | queue_items | Yes | Production |
| DB__work_order_routing | work_order_routing | Yes | Production |
| DB__handoff_records | handoff_records | Yes | Production |
| DB__current_station_status | current_station_status | Yes | Production |
| DB__operator_station_sessions | operator_station_sessions | Yes | Production |
| DB__ncr_reports | ncr_reports | Yes | Quality |
| DB__ncr_audit_log | ncr_audit_log | Yes | Quality |
| DB__quality_checkpoints | quality_checkpoints | Yes | Quality |
| DB__quality_inspections | quality_inspections | Yes | Quality |
| DB__equipment | equipment | Yes | Assets |
| DB__downtime_events | downtime_events | Yes | Assets |
| DB__entitlements | entitlements | Yes | Billing |
| DB__subscriptions | subscriptions | Yes | Billing |
| DB__erp_connections | erp_connections | Yes | Integration |
| DB__activity_logs | activity_logs | Yes | Audit |
| DB__data_access_logs | data_access_logs | Yes | Audit/ITAR |

## External Systems (EXT)

| Node ID | System | Integration Type |
|---------|--------|-----------------|
| EXT__stripe | Stripe | Webhooks + API |
| EXT__resend | Resend | Email API |
| EXT__erp | ERP Systems | REST API (configurable) |
| EXT__lovable_ai | Lovable AI | Edge function proxy |

## Roles (ROLE)

| Node ID | Role | Scope | Table |
|---------|------|-------|-------|
| ROLE__admin | admin | Platform | user_roles |
| ROLE__developer | developer | Platform | user_roles |
| ROLE__supervisor | supervisor | Platform + Org | user_roles |
| ROLE__operator | operator | Platform (default) | user_roles |
| ROLE__viewer | viewer | Platform | user_roles |
| ROLE__org_owner | owner | Organization | organization_members |
| ROLE__org_admin | admin | Organization | organization_members |
| ROLE__org_member | member | Organization | organization_members |
| ROLE__team_owner | owner | Team | team_members |
| ROLE__team_admin | admin | Team | team_members |
| ROLE__team_member | member | Team | team_members |
