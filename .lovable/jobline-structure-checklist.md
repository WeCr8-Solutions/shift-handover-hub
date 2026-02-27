# JobLine Platform: Structure & Health Checklist

**Last Updated**: 2026-02-27  
**Purpose**: Periodic review document to ensure no users get stuck, all features are tested, and the full hierarchy is documented.

---

## 1. Complete Parent → Child Hierarchy

```
JobLine Platform
├── 🔐 Authentication Layer
│   ├── Email/Password signup
│   ├── Email verification
│   ├── Password reset flow
│   ├── handle_new_user trigger
│   │   ├── → Creates profiles record
│   │   ├── → Assigns 'operator' role in user_roles
│   │   └── → Creates user_onboarding record
│   └── Session management (Supabase Auth)
│
├── 👤 User System
│   ├── Profiles (user_id, display_name, email, avatar_url)
│   ├── User Roles (platform-level)
│   │   ├── admin (platform super-admin)
│   │   ├── developer (testing/SDK access)
│   │   ├── supervisor (production oversight)
│   │   ├── operator (base — auto-assigned)
│   │   └── viewer (read-only)
│   └── User Onboarding
│       ├── welcome → org-setup → shop-setup → dashboard-tour → complete
│       ├── Core steps (mandatory)
│       └── Pro tours (optional: quotes, teams, admin)
│
├── 🏢 Organization Layer
│   ├── Organizations
│   │   ├── name, slug, created_by
│   │   ├── subscription_tier, subscription_status
│   │   ├── stripe_customer_id
│   │   └── trial_ends_at
│   ├── Organization Members (user ↔ org join)
│   │   ├── owner (full control, billing)
│   │   ├── admin (manage members/teams)
│   │   └── member (standard access)
│   ├── Organization Invites
│   │   ├── secret_code (8-char alphanumeric)
│   │   ├── QR code generation
│   │   ├── team_id (auto-join team)
│   │   ├── org_role, app_role assignment
│   │   ├── max_uses, expires_at
│   │   └── Invite Redemptions (tracking)
│   ├── Entitlements (plan-based feature gates)
│   │   ├── features: { handoff_hub, work_orders, analytics, api_access, bulk_upload }
│   │   └── limits: { users, work_orders_per_month, stations }
│   ├── Organization Feature Flags
│   ├── Organization API Keys
│   ├── Organization Webhooks → Webhook Deliveries
│   ├── Organization Usage (metered billing)
│   └── App Settings (org-scoped + team-scoped)
│       ├── manufacturing_preferences (enableQuoteSystem, etc.)
│       ├── shift_settings
│       └── notification_preferences
│
├── 👥 Team Layer
│   ├── Teams (name, organization_id, created_by)
│   ├── Team Members (user ↔ team join)
│   │   ├── owner
│   │   ├── admin
│   │   └── member
│   └── Departments (grouping within teams)
│
├── 🏭 Station Layer
│   ├── Stations
│   │   ├── name, work_center_type, team_id, organization_id
│   │   ├── status (running/idle/down/maintenance)
│   │   └── metadata, capabilities
│   ├── Current Station Status (real-time snapshot)
│   │   ├── current_job_work_order, current_job_part_number
│   │   ├── current_operator_id/name
│   │   ├── parts_complete, parts_required
│   │   └── condition_status, condition_notes
│   ├── Operator Station Sessions (check-in/out)
│   │   ├── user_id, station_id
│   │   ├── checked_in_at, checked_out_at
│   │   └── is_active
│   └── Equipment Registry
│       ├── asset_tag, serial_number, equipment_type
│       ├── calibration tracking (last_calibration, calibration_due)
│       ├── maintenance_history
│       └── station_id assignment
│
├── 📋 Work Order / Queue System
│   ├── Queue Items (work_order, quote, station_task, team_task, support_ticket)
│   │   ├── work_order, part_number, operation_number
│   │   ├── quantity tracking: qty_original, qty_completed, qty_scrap, qty_rework, qty_open
│   │   ├── quantity_locked (auto-lock when completed >= original)
│   │   ├── status: pending → queued → in_progress → completed / on_hold / cancelled
│   │   ├── priority: low, normal, high, urgent, critical
│   │   ├── position (drag-drop ordering)
│   │   ├── estimated_duration (auto-computed from setup + FA + cycle × qty)
│   │   ├── parent_work_order_id, is_rework (child WO support)
│   │   └── tags, customer_name, due_date
│   ├── Work Order Routing (per-item routing steps)
│   │   ├── step_number, operation_name, operation_type
│   │   ├── station_id (assigned station)
│   │   ├── status: pending → in_progress → completed / skipped
│   │   ├── setup_time_minutes, first_article_minutes, cycle_time_minutes
│   │   ├── estimated_duration (auto-computed)
│   │   ├── is_outside_process, vendor details
│   │   └── completed_by, completed_at
│   ├── Routing Templates (reusable routing sequences)
│   │   └── Routing Template Steps
│   ├── Queue Item History (audit log per item)
│   └── Delivery Requests (inter-station material movement)
│       ├── from_station_id → to_station_id
│       ├── status: requested → picked_up → delivered
│       └── priority, quantity, notes
│
├── 🔄 Handoff System
│   ├── Handoff Records
│   │   ├── outgoing_operator → incoming_operator
│   │   ├── work_order, part_number, operation_number
│   │   ├── shift (Day/Swing/Night)
│   │   ├── primary_state, state_reason
│   │   ├── parts_completed_this_shift, scrap_count, rework_count
│   │   ├── Work center-specific conditions:
│   │   │   ├── machine_condition (CNC)
│   │   │   ├── water_jet_condition
│   │   │   ├── welding_condition
│   │   │   └── equipment_readiness (general)
│   │   ├── Quality: critical_dims_verified, qa_notified
│   │   ├── Material: raw_material_available, next_material_lot_ready
│   │   ├── image_urls (attachments)
│   │   └── process_notes_for_next_shift
│   └── Handoff Attachments (storage bucket)
│
├── 🔍 Quality / NCR System
│   ├── NCR Reports
│   │   ├── ncr_number (auto-generated: NCR-YYYYMMDD-NNNN)
│   │   ├── queue_item_id (linked work order)
│   │   ├── disposition: scrap / rework / use_as_is / return_to_vendor
│   │   ├── authorization_status: pending → approved / rejected
│   │   ├── quantity_affected
│   │   ├── rework_wo_id (auto-created child WO on rework disposition)
│   │   └── root_cause, corrective_action
│   ├── NCR Audit Log
│   └── NCR Attachments (storage bucket)
│
├── 📊 Analytics & Reporting
│   ├── Job Performance Updates (continuous improvement)
│   │   ├── update_type, priority, status
│   │   ├── affects_cycle_time, affects_quality, affects_safety
│   │   ├── Review workflow: submitted → reviewed → approved/rejected
│   │   └── assigned_station_id, assigned_team_id
│   ├── Downtime Events
│   │   ├── downtime_type, reason_code
│   │   ├── started_at, ended_at, duration_minutes (auto-calculated)
│   │   └── station_id, equipment_id, work_order_id
│   ├── Activity Logs (system-wide audit trail)
│   ├── Shift Schedules → Shift Assignments
│   └── Data Export Requests
│
├── 💳 Billing & Subscription
│   ├── Stripe integration (checkout, portal, webhooks)
│   ├── Subscription tiers: free → single → team → enterprise
│   ├── ERP Connector add-on tiers: starter ($100) → pro ($150) → unlimited ($200)
│   │   ├── erp_usage_metering table (monthly sync counter)
│   │   ├── increment_erp_sync_usage() DB function (tier limit enforcement)
│   │   ├── Stripe webhook: ERP product detection + erp_tier management
│   │   └── erp-sync edge function: 429 response at sync limit
│   ├── Trial management (trial_ends_at)
│   ├── Entitlement enforcement (feature + limit gates)
│   └── Donation support
│
├── 📢 Communications
│   ├── Global Updates (platform announcements)
│   │   ├── category, impact_level, version_number
│   │   ├── requires_acknowledgement
│   │   └── Global Update Acknowledgements
│   ├── Announcements (org-scoped)
│   ├── Changelogs (version history)
│   ├── Notification Queue (email dispatch)
│   └── Email System (Resend integration)
│       ├── Templates: welcome, team-invite, password-reset, handoff-notification, promo-code
│       └── Auth email hook (custom branded auth emails)
│
├── 🐛 Issue Tracking (Dev Tools)
│   ├── Issues (user-reported bugs)
│   │   ├── severity: critical / high / medium / low
│   │   ├── status: new → triaged → in_progress → resolved / closed
│   │   ├── console_logs, error_stack, page_url
│   │   └── report_issue() RPC function
│   ├── Dev Issue Queue (auto-queued via trigger)
│   │   ├── priority, queue_position
│   │   ├── assigned_developer_id
│   │   └── time_spent_minutes
│   └── RLS Health Check (edge function)
│
├── 🔑 Security Layer (RLS)
│   ├── Helper Functions
│   │   ├── has_role(user_id, role)
│   │   ├── is_org_member(user_id, org_id)
│   │   ├── is_org_admin(user_id, org_id)
│   │   ├── is_team_member(user_id, team_id)
│   │   ├── is_team_admin(user_id, team_id)
│   │   ├── is_supervisor_for_team(user_id, team_id)
│   │   ├── is_supervisor_in_org(user_id, org_id)
│   │   ├── can_operator_act_on_station(user_id, station_id)
│   │   ├── can_supervisor_override_in_org(user_id, org_id)
│   │   ├── can_approve_ncr(user_id, org_id)
│   │   ├── can_manage_billing(user_id, org_id)
│   │   ├── can_adjust_wo_quantity(user_id, org_id)
│   │   └── is_dev_or_admin(user_id)
│   ├── Auto-populate triggers (org_id from team, station, etc.)
│   └── Billing field protection trigger
│
├── 🧪 Testing Infrastructure
│   ├── Unit Tests (Vitest)
│   │   ├── Button, StatusBadge, ShiftStats
│   │   ├── useEmail, useQueue, useStations, useOperatorSessions
│   │   ├── QueueFilters, QueueCalendarView, QueueStatsCards
│   │   ├── QueueItemPreAdvanceValidation, QueueItemHandoff
│   │   ├── OperatorStationPanel, SupervisorDashboard
│   │   ├── NewHandoffForm, machineTime, ncrUtils, utils
│   │   └── Org Scope Integration
│   ├── Process Tests (in-app, live DB)
│   │   ├── Routing Validation (3 tests)
│   │   ├── Work Order Flow (4 tests)
│   │   ├── Database Integration (4 tests)
│   │   ├── Manufacturing Process (3 tests)
│   │   ├── Security & RLS (6 tests)
│   │   ├── Autofill & User Context (8 tests)
│   │   └── Quote-to-Ship Routing (8 tests)
│   └── Role & Scope Tests (in-app, live DB)
│       ├── Platform Roles (5 tests)
│       ├── Organization Roles (4 tests)
│       ├── Team Roles (4 tests)
│       ├── Scope Isolation (5 tests)
│       ├── RLS Helper Functions (5 tests)
│       └── Target User Analysis (5 tests)
│
├── 🌐 Marketing & Landing
│   ├── Landing page with feature sections
│   ├── Feature pages (15+ SEO pages)
│   ├── Pricing page
│   ├── Demo page
│   ├── Lead capture (email_leads table)
│   └── Ad placement & UTM tracking
│
└── ⚙️ Edge Functions (Backend)
    ├── auth-email-hook (custom auth emails)
    ├── send-email (transactional emails)
    ├── check-subscription (billing status)
    ├── create-checkout (Stripe checkout)
    ├── create-donation (donation processing)
    ├── customer-portal (Stripe portal)
    ├── stripe-webhook (event handling)
    ├── report-issue (bug reporting RPC)
    ├── rls-health (policy verification)
    ├── ai-planning-assistant (AI chat)
    └── social-agent (social integration)
```

---

## 2. User Journey Health Checklist

Review this periodically. Mark ✅ when verified, ❌ when broken, 🔄 when in progress.

### 2.1 New User Signup Flow

| # | Checkpoint | Status | Last Verified | Notes |
|---|-----------|--------|---------------|-------|
| 1 | Email/password signup works | | | |
| 2 | Email verification sent | | | |
| 3 | `handle_new_user` trigger fires | | | |
| 4 | Profile record created with display_name | | | |
| 5 | `operator` role auto-assigned in user_roles | | | |
| 6 | `user_onboarding` record created | | | |
| 7 | Welcome modal appears on first login | | | |
| 8 | User can dismiss welcome modal | | | |

### 2.2 Organization Setup (First-Time Founder)

| # | Checkpoint | Status | Last Verified | Notes |
|---|-----------|--------|---------------|-------|
| 1 | User can create organization | | | |
| 2 | User auto-becomes org `owner` | | | |
| 3 | Free-tier entitlements auto-created | | | |
| 4 | Onboarding advances to shop-setup | | | |
| 5 | User can create first team | | | |
| 6 | User auto-becomes team `owner` | | | |
| 7 | User can create stations under team | | | |
| 8 | Dashboard tour starts after setup | | | |

### 2.3 Invite Code Join Flow

| # | Checkpoint | Status | Last Verified | Notes |
|---|-----------|--------|---------------|-------|
| 1 | Admin can generate invite code | | | |
| 2 | QR code renders correctly | | | |
| 3 | Secret code is copyable | | | |
| 4 | Direct link format works `/auth?invite=CODE` | | | |
| 5 | New user sees invite code input on signup | | | |
| 6 | Existing user can redeem invite code | | | |
| 7 | User added to correct org with specified role | | | |
| 8 | User added to correct team (if specified) | | | |
| 9 | App role assigned (supervisor/operator) | | | |
| 10 | Usage count incremented | | | |
| 11 | Expired codes are rejected | | | |
| 12 | Max-use codes are rejected after limit | | | |

### 2.4 Daily Operator Workflow

| # | Checkpoint | Status | Last Verified | Notes |
|---|-----------|--------|---------------|-------|
| 1 | Operator can check into station | | | |
| 2 | Active WO displayed at station | | | |
| 3 | Operator can start/pause work | | | |
| 4 | Parts completed count updates | | | |
| 5 | Handoff form pre-fills operator name | | | |
| 6 | Handoff form pre-fills WO/part from station | | | |
| 7 | Handoff submission succeeds | | | |
| 8 | Handoff image upload works | | | |
| 9 | Operator can check out of station | | | |
| 10 | Station status clears on checkout | | | |

### 2.5 Supervisor Workflow

| # | Checkpoint | Status | Last Verified | Notes |
|---|-----------|--------|---------------|-------|
| 1 | Supervisor sees all org stations | | | |
| 2 | Supervisor can create work orders | | | |
| 3 | Supervisor can assign WO to station | | | |
| 4 | Supervisor can advance WO to next step | | | |
| 5 | Supervisor override works with reason | | | |
| 6 | Performance update review works | | | |
| 7 | NCR approval/rejection works | | | |
| 8 | Queue drag-drop reordering works | | | |

### 2.6 Admin / Billing

| # | Checkpoint | Status | Last Verified | Notes |
|---|-----------|--------|---------------|-------|
| 1 | Org owner can access billing settings | | | |
| 2 | Checkout session creates correctly | | | |
| 3 | Stripe webhook updates subscription | | | |
| 4 | Entitlements update on plan change | | | |
| 5 | Feature gates enforce limits | | | |
| 6 | Trial expiration shows upgrade prompt | | | |
| 7 | Customer portal accessible | | | |

---

## 3. Common "User Stuck" Scenarios & Fixes

| # | Symptom | Root Cause | Detection | Fix |
|---|---------|------------|-----------|-----|
| 1 | Blank dashboard after signup | No org membership, RLS blocks all queries | `organization_members` empty for user | Complete org setup or redeem invite |
| 2 | "Loading..." forever | `handle_new_user` trigger failed | Missing profile or user_roles record | Admin: create profile + operator role manually |
| 3 | Can't create work orders | User is `member` not `admin/owner/supervisor` | Check org_members role + user_roles | Upgrade org role or assign supervisor |
| 4 | Can't see team stations | Not a team member | `team_members` empty for user's teams | Add user to team |
| 5 | Onboarding won't advance | `has_seen_welcome` still false | `user_onboarding.current_step` stuck | Mark welcome seen via admin panel |
| 6 | "Unauthorized" on every action | Missing `operator` role | `user_roles` empty | Add operator role |
| 7 | Can't create teams | Not org admin/owner | `organization_members.role = 'member'` | Upgrade to admin or have admin create |
| 8 | Settings don't save | Profile update RLS issue | Check `profiles` RLS for self-update | Verify `auth.uid() = user_id` policy |
| 9 | Invite code "invalid" | Code expired or max uses reached | Check `organization_invites` record | Generate new invite code |
| 10 | Station check-in fails | Already checked into another station | `operator_station_sessions.is_active = true` | Check out of other station first |
| 11 | WO can't advance to next step | No routing steps defined | `work_order_routing` empty for item | Add routing steps to work order |
| 12 | Quantity locked, can't update | `qty_completed >= qty_original` | `quantity_locked = true` | Org owner can increase qty_original |
| 13 | NCR approval blocked | User not supervisor or org admin | `can_approve_ncr()` returns false | Assign supervisor role |
| 14 | Quote features missing | Quote system disabled in settings | `manufacturing_preferences.enableQuoteSystem` | Enable in Settings → Manufacturing |
| 15 | Email notifications not sending | Missing RESEND_API_KEY or rate limited | Check edge function logs | Verify secret, check rate limit table |

---

## 4. Test Coverage Gap Analysis

### 4.1 Unit Tests (Vitest) — Current Coverage

| Test File | Area | Tests | Status |
|-----------|------|-------|--------|
| button.test.tsx | UI Components | 6 | ✅ Implemented |
| StatusBadge.test.tsx | UI Components | 12 | ✅ Implemented |
| useEmail.test.ts | Email Hook | 4 | ✅ Implemented |
| useQueue.test.ts | Queue Management | 9 | ✅ Implemented |
| useStations.test.ts | Station Scoping | 4 | ✅ Implemented |
| useOperatorSessions.test.ts | Operator Sessions | 5 | ✅ Implemented |
| QueueFilters.test.tsx | Queue UI | 5 | ✅ Implemented |
| QueueCalendarView.test.tsx | Queue UI | 7 | ✅ Implemented |
| QueueStatsCards.test.tsx | Queue UI | 4 | ✅ Implemented |
| QueueItemPreAdvanceValidation.test.ts | Routing Logic | ~ | ✅ Implemented |
| QueueItemDetailDialog.handoff.test.tsx | Handoff Integration | ~ | ✅ Implemented |
| ShiftStats.test.tsx | Dashboard | 3 | ✅ Implemented |
| OperatorStationPanel.test.tsx | Dashboard | ~ | ✅ Implemented |
| SupervisorDashboard.test.tsx | Dashboard | ~ | ✅ Implemented |
| NewHandoffForm.test.ts | Handoff Form | ~ | ✅ Implemented |
| utils.test.ts | Utilities | 8 | ✅ Implemented |
| machineTime.test.ts | Calculations | ~ | ✅ Implemented |
| ncrUtils.test.ts | NCR Logic | ~ | ✅ Implemented |
| org-scope-integration.test.ts | Integration | ~ | ✅ Implemented |

### 4.2 Missing Unit Tests (Gaps to Fill)

| Area | Suggested Test File | Priority | What to Test |
|------|-------------------|----------|--------------|
| Auth Context | AuthContext.test.tsx | 🔴 High | Login/logout flows, role loading, redirect logic |
| Team Context | TeamContext.test.tsx | 🔴 High | Team selection persistence, org scoping |
| Invite Redemption | InviteCodeRedemption.test.tsx | 🔴 High | Code validation, team/role assignment |
| Onboarding Provider | OnboardingProvider.test.tsx | 🟡 Medium | Step progression, core vs pro steps |
| useSubscription | useSubscription.test.ts | 🟡 Medium | Plan detection, trial status |
| useEntitlements | useEntitlements.test.ts | 🟡 Medium | Feature/limit gate enforcement |
| useTeams | useTeams.test.ts | 🟡 Medium | CRUD operations, org scoping |
| useBulkUpload | useBulkUpload.test.ts | 🟢 Low | Excel parsing, validation |
| useNCR | useNCR.test.ts | 🟡 Medium | NCR creation, disposition flow |
| WorkOrderRoutingEditor | WorkOrderRoutingEditor.test.tsx | 🟡 Medium | Step add/remove/reorder |
| OrganizationMemberManager | OrganizationMemberManager.test.tsx | 🟡 Medium | Role assignment, member removal |

### 4.3 In-App Tests (Process + Role & Scope) — Current Coverage

| Suite | Category | Tests | Status |
|-------|----------|-------|--------|
| Routing Validation | Process | 3 | ✅ |
| Work Order Flow | Process | 4 | ✅ |
| Database Integration | Process | 4 | ✅ |
| Manufacturing Process | Process | 3 | ✅ |
| Security & RLS | Process | 6 | ✅ |
| Autofill & User Context | Process | 8 | ✅ |
| Quote-to-Ship Routing | Process | 8 | ✅ |
| Platform Roles | Role & Scope | 5 | ✅ |
| Organization Roles | Role & Scope | 4 | ✅ |
| Team Roles | Role & Scope | 4 | ✅ |
| Scope Isolation | Role & Scope | 5 | ✅ |
| RLS Helper Functions | Role & Scope | 5 | ✅ |
| Target User Analysis | Role & Scope | 5 | ✅ |

### 4.4 Missing In-App Tests (Gaps to Fill)

| Suite | Category | Priority | What to Test |
|-------|----------|----------|--------------|
| Invite Code Flow | Process | 🔴 High | Generate → Redeem → Verify membership |
| NCR Disposition | Process | 🟡 Medium | Scrap/rework/use-as-is effects on WO quantities |
| Billing & Entitlements | Process | 🟡 Medium | Feature gates, limit enforcement |
| Onboarding Flow | Process | 🟡 Medium | Step completion, journey advancement |
| Operator Session | Role & Scope | 🔴 High | Check-in/out, can_operator_act_on_station |
| Supervisor Override | Role & Scope | 🟡 Medium | pass_work_order_to_next_step with override |
| Cross-Org Isolation | Role & Scope | 🔴 High | Verify handoffs, NCRs, performance updates scoped |
| Delivery Requests | Process | 🟢 Low | Request → pickup → deliver flow |

---

## 5. Edge Function Test Coverage

| Function | Has Tests | Priority | Notes |
|----------|-----------|----------|-------|
| send-email | ✅ index.test.ts | — | Template rendering + sending |
| auth-email-hook | ❌ | 🟡 Medium | Custom auth email rendering |
| check-subscription | ❌ | 🟡 Medium | Stripe subscription check |
| create-checkout | ❌ | 🟡 Medium | Stripe session creation |
| create-donation | ❌ | 🟢 Low | Donation link creation |
| customer-portal | ❌ | 🟢 Low | Portal URL generation |
| stripe-webhook | ❌ | 🔴 High | Event handling, subscription sync |
| report-issue | ❌ | 🟢 Low | Issue creation RPC |
| rls-health | ❌ | 🟡 Medium | Policy verification |
| ai-planning-assistant | ❌ | 🟢 Low | AI response handling |
| social-agent | ❌ | 🟢 Low | Social integration |

---

## 6. RLS Policy Audit Schedule

Review monthly. Check these critical tables:

| Table | RLS Enabled | Key Policies | Last Audited |
|-------|-------------|-------------|--------------|
| organizations | ✅ | org_member SELECT, owner/admin UPDATE | |
| organization_members | ✅ | self + org_admin access | |
| teams | ✅ | org_member scoped | |
| team_members | ✅ | team + org scoped | |
| stations | ✅ | org_member via team | |
| queue_items | ✅ | org_member scoped | |
| handoff_records | ✅ | org_member scoped | |
| profiles | ✅ | self-update, org visibility | |
| user_roles | ✅ | admin-only INSERT, self SELECT | |
| user_onboarding | ✅ | self access only | |
| ncr_reports | ✅ | org_member scoped | |
| activity_logs | ✅ | admin/developer access | |
| issues | ✅ | reporter + admin access | |
| entitlements | ✅ | org_member SELECT | |

---

## 7. Performance & Scale Checkpoints

| Metric | Threshold | How to Check |
|--------|-----------|-------------|
| Query response time | < 200ms | Monitor Supabase analytics |
| Dashboard load time | < 2s | Browser performance tools |
| Queue item count per org | < 1000 default limit | Pagination implemented? |
| Handoff records per team | Monitor growth | Archive old records? |
| Activity logs volume | Growing | Retention policy needed? |
| Edge function cold starts | < 1s | Monitor function logs |

---

## 8. Review Schedule

| Frequency | What to Review | Who |
|-----------|---------------|-----|
| **Weekly** | Section 2 (User Journey) — spot check 2-3 flows | Developer |
| **Bi-weekly** | Section 4 (Test Gaps) — add 1-2 missing tests | Developer |
| **Monthly** | Section 6 (RLS Audit) — verify critical table policies | Admin + Developer |
| **Quarterly** | Full document review, update hierarchy, archive old issues | Team |

---

*This document should be updated whenever new features, tables, or roles are added to the platform.*
