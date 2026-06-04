# Appendix A — File / Citation Index

Master `file:line` and table lookup for every "current state" claim in this audit. Use this when you need to verify a finding before quoting it.

---

## A.1 Routing / pages

| Path | Surface |
|---|---|
| `src/App.tsx` lines 205–321+ | All 150 application routes |
| `src/pages/WorkOrdersHub.tsx` | Work order header & list |
| `src/pages/WorkOrderTraveler.tsx` | Digital traveler |
| `src/pages/CompletedWorkOrders.tsx` | Completed WOs |
| `src/pages/CancelledWorkOrders.tsx` | Cancelled WOs (mem://features/work-order/cancellation-and-hold-audit) |
| `src/pages/OnHoldWorkOrders.tsx` | On-hold WOs |
| `src/pages/Queue.tsx`, `QueueHub.tsx` | Queue Kanban/List/Calendar |
| `src/pages/PlanningCenter.tsx` | AI planning center |
| `src/pages/QuotesHub.tsx`, `QuoteHistoryPage.tsx` | Quote system |
| `src/pages/WorkOrderHistoryPage.tsx` | WO history |
| `src/pages/Teams.tsx` | Team management |
| `src/pages/ShopFloorDisplay.tsx` | Floor display + casting |
| `src/pages/OperatorInbox.tsx` | Operator inbox |
| `src/pages/OperatorProfile.tsx`, `PublicOperatorProfile.tsx` | Operator profile + public |
| `src/pages/TalentBrowse.tsx`, `TalentSearch.tsx`, `TalentLanding.tsx`, `TalentDashboard.tsx` | Talent network |
| `src/pages/OapHub.tsx`, `OapCoursePlayer.tsx`, `OapWalkthrough.tsx`, `OapMyTranscript.tsx`, `OapEmployer.tsx` | OAP surfaces |
| `src/pages/GCALanding.tsx`, `GcaTestPage.tsx`, `GcaEmployer.tsx` | GCA surfaces |
| `src/pages/HandbookLibrary.tsx`, `HandbookEntry.tsx` | Handbook |
| `src/pages/ToolProficiency.tsx` | Tool proficiency tests |
| `src/pages/integrations/{NativeIntegration,JobBossIntegration,SapIntegration}.tsx` | Three-path ERP setup |
| `src/pages/Admin.tsx` | Admin |
| `src/pages/Settings.tsx` | Settings |
| `src/pages/Updates.tsx` | Changelogs / global updates |

## A.2 Components — dashboard

| Path | Surface |
|---|---|
| `src/components/dashboard/SupervisorDashboard.tsx` | Supervisor home |
| `src/components/dashboard/OperatorDashboard.tsx`, `OperatorStationPanel.tsx` | Operator Kanban |
| `src/components/dashboard/DashboardKPICards.tsx` | KPI tiles |
| `src/components/dashboard/ProductionAnalytics.tsx` | Output / status / teams / WC / trend |
| `src/components/dashboard/StationCheckIn.tsx` | Operator station check-in |
| `src/components/dashboard/StationDetailView.tsx`, `StationListTable.tsx`, `StationQuickActions.tsx`, `StationAlertTile.tsx` | Station surfaces |
| `src/components/dashboard/DataSourceBanner.tsx` | ERP persistence mode banner |
| `src/components/dashboard/charts/*` | Recharts modules |
| `src/components/HandoffCard.tsx`, `HandoffDetailModal.tsx`, `NewHandoffForm.tsx` | Handoff surfaces |
| `src/components/IssueReportDialog.tsx`, `IssueReporterBoot.tsx` | Issue reporter |
| `src/components/NotificationPanel.tsx`, `DeviceNotificationDispatcher.tsx` | Notifications |
| `src/components/JobPerformanceUpdateForm.tsx` | WO progress form |
| `src/components/TeamManagement.tsx`, `TeamStationManager.tsx`, `WorkCenterFilter.tsx` | Team/work-center mgmt |
| `src/components/InviteCodeGenerator.tsx`, `InviteCodeRedemption.tsx`, `InviteTeamMemberDialog.tsx` | Invite lifecycle |

## A.3 Hooks (selected)

| Hook | Purpose |
|---|---|
| `useOrganization` | Standard multi-tenant context (mem://technical/hooks/use-organization) |
| `useStations` | Station + handoff team-scoped reads |
| `useHandoffRecords` (in `useStations.ts`) | Handoff records |
| `useQueue`, `useUnifiedQueue` | Queue items + ERP-aware unified queue |
| `useDataSourceMode` | ERP persistence mode |
| `useERPConnector`, `useSapSandbox` | ERP integration |
| `usePlanningAssistant` | AI planning |
| `useLoadBalancer` | Capacity planning heuristic |
| `useNCR` | Non-conformance reports |
| `useDimensions`, `useDimensionRequests` | Quality dim checks |
| `useSetupSheets`, `useMachineManuals`, `useMachiningOperations` | Engineering reference |
| `useOperatorProfile`, `useOperatorSessions`, `useOperatorSocial` | Operator identity |
| `useOapProgram`, `useOapMentors`, `useOapRecert`, `useOapAdmin`, `useOapWalkthrough` | OAP |
| `useGcaAccess`, `useGcaAdmin`, `useGcaAssignments` | GCA |
| `useTalent`, `useTalentInboxUnread` | Talent network |
| `useDNCConnector`, `useJobLineRelay`, `useMachineMonitoring` | Machine I/O |
| `useEntitlements`, `useSubscription`, `useTrialStatus` | Billing / entitlements |
| `useRoleArchitecture` | Role scoping (mem://technical/role-architecture/scoped-access) |
| `useNotificationPrefs`, `useSmartAlerts` | Alerts |
| `useShopFloorDisplays` | Public floor displays |
| `useTeams`, `useWorkCenterConfigs`, `useShiftSchedules` | Org structure |
| `useWorkOrderTraveler`, `useTravelerSettings` | Traveler |
| `useWorkOrderHistory`, `useQuoteHistory`, `useQuoteSystem` | History |

## A.4 Edge functions

| Function | Purpose |
|---|---|
| `ai-planning-assistant` | Live execution-context AI |
| `apply-routing-change` | Supervisor-approved AI routing changes |
| `erp-sync`, `sap-sync` | ERP read-through / write-through sync |
| `activate-station-context`, `verify-station-context-payment` | Station context |
| `process-notifications`, `send-email` | Notifications + email |
| `report-issue` | Issue reporter |
| `issue-certificate` | Cert issuance |
| `gca-progress-sync` | GCA progress |
| `extract-manual-pages`, `parse-resume` | Document parsing |
| `check-subscription`, `create-checkout`, `customer-portal`, `update-seats`, `stripe-webhook`, `create-cert-checkout`, `create-donation` | Billing |
| `rls-health`, `seed-e2e`, `log-export` | Ops |
| `billing-reminder-cron`, `send-billing-reminder` | Billing reminders |
| `send-policy-change-notification` | Policy comms |
| `social-agent`, `auth-email-hook` | Auth + social |

## A.5 Tables — by capability

Full list in `appendix-b-data-model-map.md`. Quick references used in this audit:

| Table | Cols / Policies | Used by |
|---|---|---|
| `queue_items` | 67 / 9 | Unified queue, WO list |
| `work_order_routing` | 24 / 6 | Per-WO routing |
| `routing_templates`, `routing_template_steps` | 9/3, 12/2 | Routing template |
| `routing_step_dimensions` | 14 / 3 | Per-step dim requirements |
| `dimension_check_requests`, `dimension_readings` | 14/4, 12/4 | Inspections |
| `ncr_reports`, `ncr_audit_log` | 25/4, 11/1 | Quality NCRs |
| `quality_inspections`, `quality_checkpoints` | 15/4, 10/3 | Checkpoint inspections |
| `handoff_records` | 52 / 5 | Shift handoffs |
| `current_station_status` | 14 / 8 | Live station state |
| `stations`, `station_machine_assignments`, `station_manual_machine_profiles` | 11/11, 6/5, 46/4 | Station registry |
| `equipment`, `maintenance_records`, `downtime_events` | 20/4, 18/3, 19/4 | Equipment + maintenance |
| `material_lots` | 16 / 3 | Material lot tracking |
| `delivery_requests` | 21 / 5 | Inbound/outbound delivery |
| `inspection_tools`, `inspection_tool_categories` | 20/4, 10/4 | Gage registry |
| `tool_proficiency_tests`, `tool_proficiency_attempts` | 16/3, 15/4 | Tool proficiency |
| `setup_sheets` | 15 / 5 | Setup sheets |
| `machine_manuals`, `machine_manual_pages` | 20/4, 6/2 | Machine docs |
| `program_release_log` | 10 / 3 | Program releases |
| `verified_machine_library`, `station_manual_machine_profiles` | 40/2, 46/4 | Machine catalog |
| `operator_profiles` | 49 / 4 | Operator identity |
| `operator_skills`, `operator_certifications`, `operator_education`, `operator_work_history`, `operator_machine_proficiencies`, `operator_references`, `operator_resume_versions`, `operator_station_sessions` | various | Operator data graph |
| `oap_*` (20+ tables) | various | OAP cert program |
| `gca_*` (10+ tables) | various | G-Code Academy |
| `talent_*`, `operator_follows`, `operator_connections`, `operator_recommendations` | various | Talent network |
| `certifying_mentors`, `certifications`, `user_certifications`, `certificate_templates` | various | Mentor + cert |
| `org_messages`, `talent_message_replies`, `recruiter_messaging_limits` | 7/4, 6/3, 11/1 | Messaging |
| `organizations`, `organization_members`, `organization_branding`, `organization_billing`, `organization_invites`, `organization_traveler_settings`, `organization_feature_flags`, `organization_integrations`, `organization_webhooks`, `organization_usage`, `organization_audit_events` | various | Multi-tenant graph |
| `erp_connections`, `erp_sync_logs`, `erp_sync_errors`, `erp_status_mappings`, `erp_work_center_mappings`, `erp_usage_metering` | various | ERP integration |
| `notification_queue`, `notification_preferences`, `email_delivery_events`, `email_templates`, `email_rate_limits`, `email_suppressions` | various | Comms |
| `webhook_deliveries`, `api_request_logs`, `activity_logs`, `data_access_logs`, `data_export_requests` | various | Platform observability |
| `subscriptions`, `entitlements`, `billing_events`, `stripe_events`, `billing_reminder_log`, `billing_notes` | various | Billing |
| `act_as_sessions` | 9 / 3 | Admin impersonation (mem://features/admin/act-as-impersonation) |
| `dev_issue_queue`, `issues` | 14/4, 27/5 | Issue tracking |
| `handbook_categories`, `handbook_references`, `handbook_links` | 9/3, 16/3, 7/3 | Handbook |
| `flyer_*` (8 tables) | various | Flyer campaign system |
| `shop_floor_displays` | 22 / 4 | Public TVs |

---

# Appendix B — Data Model Map

Which of the ~180 tables back which capability. Use this to find latent capability (tables present, no UI) and façade risk (UI present, weak data).

## B.1 Capability → primary tables

| Capability | Primary tables |
|---|---|
| Work order header + state | `queue_items` |
| WO routing per-instance | `work_order_routing` |
| WO routing templates | `routing_templates`, `routing_template_steps`, `routing_step_dimensions` |
| WO history / audit | `queue_item_history`, `queue_item_comments` |
| Quotes | (managed via `useQuoteSystem`) — see hook for tables |
| Shift handoff | `handoff_records` |
| Live station state | `current_station_status`, `stations`, `station_machine_assignments`, `station_manual_machine_profiles` |
| Equipment / maintenance | `equipment`, `maintenance_records`, `downtime_events` |
| Quality | `ncr_reports`, `ncr_audit_log`, `quality_inspections`, `quality_checkpoints`, `dimension_check_requests`, `dimension_readings`, `routing_step_dimensions` |
| Tools (gages) | `inspection_tools`, `inspection_tool_categories`, `tool_proficiency_tests`, `tool_proficiency_attempts` |
| Material | `material_lots`, `part_catalog`, `delivery_requests` |
| Engineering ref | `setup_sheets`, `machine_manuals`, `machine_manual_pages`, `program_release_log`, `machining_operations`, `machining_operation_categories`, `verified_machine_library` |
| Operator identity | `operator_profiles`, `operator_skills`, `operator_certifications`, `operator_education`, `operator_work_history`, `operator_machine_proficiencies`, `operator_references`, `operator_resume_versions`, `operator_station_sessions`, `profiles`, `user_roles`, `user_certifications`, `user_org_preferences`, `user_onboarding`, `user_sessions` |
| OAP | `oap_courses`, `oap_lessons`, `oap_enrollments`, `oap_quizzes`, `oap_quiz_questions`, `oap_quiz_attempts`, `oap_walkthrough_sections`, `oap_walkthrough_items`, `oap_walkthrough_sessions`, `oap_walkthrough_checkoffs`, `oap_role_programs`, `oap_role_program_courses`, `oap_safety_credentials`, `oap_operator_credentials`, `oap_certificates`, `oap_certificate_items`, `oap_recert_events`, `oap_transfer_tokens`, `oap_vertical_roles`, `oap_question_repair_log` |
| GCA | `gca_question_banks`, `gca_questions`, `gca_test_attempts`, `gca_subscriptions`, `gca_assignments`, `gca_professional_profiles`, `gca_machine_experience`, `gca_measurement_tools_tested`, `gca_accomplishments`, `gca_certificates`, `gca_question_repair_log` |
| Talent / social | `talent_abuse_reports`, `talent_contact_requests`, `talent_message_replies`, `talent_outreach_consents`, `talent_saved_candidates`, `talent_saved_lists`, `operator_follows`, `operator_connections`, `operator_recommendations`, `profile_views`, `recruiter_messaging_limits` |
| Cert templates | `certificate_templates`, `certifications`, `certifying_mentors` |
| Multi-tenant graph | `organizations`, `organization_members`, `teams`, `team_members`, `departments`, `org_connections` |
| Org settings | `organization_branding`, `organization_billing`, `organization_feature_flags`, `organization_integrations`, `organization_webhooks`, `organization_traveler_settings`, `organization_api_keys`, `app_settings`, `work_center_config`, `shift_schedules`, `shift_assignments` |
| Org observability | `organization_usage`, `organization_audit_events`, `org_health_snapshots`, `org_messages`, `org_support_notes` |
| ERP integration | `erp_connections`, `erp_sync_logs`, `erp_sync_errors`, `erp_status_mappings`, `erp_work_center_mappings`, `erp_usage_metering` |
| Subscriptions / billing | `subscriptions`, `entitlements`, `billing_events`, `billing_notes`, `billing_reminder_log`, `stripe_events` |
| Notifications / email | `notification_queue`, `notification_preferences`, `announcements`, `announcement_reads`, `email_delivery_events`, `email_templates`, `email_rate_limits`, `email_suppressions`, `email_leads` |
| Platform | `api_request_logs`, `activity_logs`, `data_access_logs`, `data_export_requests`, `webhook_deliveries`, `rls_health_checks`, `admin_audit_events`, `act_as_sessions` |
| Issues / dev | `issues`, `dev_issue_queue` |
| Handbook | `handbook_categories`, `handbook_references`, `handbook_links` |
| Blog / changelog | `blog_posts`, `changelogs`, `learning_ideas` |
| Compliance / policy | `policy_versions`, `policy_change_announcements`, `policy_change_email_log`, `policy_acceptances`, `terms_acceptance`, `global_updates`, `global_update_acknowledgements` |
| Marketplace | `organization_machine_purchases`, `verified_machine_library` |
| Marketing / flyer | `flyer_campaigns`, `flyer_zones`, `flyer_zone_assignments`, `flyer_stop_visits`, `flyer_drop_logs`, `flyer_mailing_lists`, `flyer_mailing_list_entries`, `flyer_mediums` |
| AI | `planning_chat_sessions`, `ai_chat_usage`, `ai_request_log` |
| Saved views / drafts | `saved_views` |
| Misc | `training_media`, `job_postings`, `job_performance_updates`, `user_manual_bookmarks`, `visitor_surveys` |

## B.2 Latent capability — tables with weak or no UI

These tables exist in the schema but have little or no UI surface today. Each is an unfulfilled feature signal.

| Table | Latent capability | Build it? |
|---|---|---|
| `recruiter_messaging_limits` | Recruiter tier rate limits | Yes — pair with recruiter subscription tier |
| `talent_abuse_reports` | Talent abuse reporting | Yes — basic admin dashboard |
| `talent_outreach_consents` | Talent outreach consent tracking | Yes — surface to operator |
| `oap_transfer_tokens` | Cross-org credential portability | Yes — already wired, needs marketing |
| `webhook_deliveries` | Outbound webhook history | Yes — debug surface for integrators |
| `rls_health_checks` | RLS regression detection | Internal — dev-only OK |
| `org_support_notes` | Support note-taking | Internal admin tool |
| `data_export_requests` | GDPR export queue | Yes — surface status to org admin |
| `org_health_snapshots` | Periodic org health snapshots | Yes — fuel exec dashboard |
| `learning_ideas` | Community-submitted learning topics | Yes — backlog page |
| `policy_change_email_log` | Policy comms audit | Internal OK |

## B.3 Façade risk — UI present, data thin

| Surface | Thin because… | Fix |
|---|---|---|
| Capacity Planning page | Heuristic only, no per-machine ideal cycle time | Capture ideal cycle on `routing_template_steps` |
| Costing / variance views | No standard cost on `part_catalog`, no per-WO labor minutes | Add `standard_cost`, `standard_labor_minutes`; extend `operator_station_sessions` |
| OEE rollup | Performance % requires ideal cycle time | Same as above |
| Predictive maintenance views (none today) | Need 90+ days of monitoring corpus | Defer until 2027 |
| FAI / SPC views | No SPC tables; FAI metadata not structured | Add `spc_samples`, `fai_forms` tables |
| Vendor / supplier views | No `vendors` table | Add `vendors`, `vendor_pos` |

---

**End of audit deliverable.**
