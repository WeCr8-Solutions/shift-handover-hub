# E2E Gap Report Summary

**Generated:** 2026-05-13T21:15:24.926Z
**Total gaps:** 318 — 13 error / 305 warn / 0 info

## Critical failures (4)
Auth bounces, RLS leaks, dead-end routes — fix first.
- **usability › guard /work-orders** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders`
  - Fix: Wrap /work-orders in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders`
- **usability › guard /work-orders** [auth] — Guarded route did not redirect anon user to /auth
  - URL: `https://joblineai.lovable.app/work-orders`
  - Fix: Wrap /work-orders in <RequireAuth> in src/App.tsx.
- **usability › guard /work-orders** [dead_end] — Anon user lands on 404 instead of auth bounce
  - URL: `https://joblineai.lovable.app/work-orders`

## Functional blockers (9)
Errors that break a core user task.
- **smoke-matrix › openWorkOrder** [other] — WO E2E-WO-001 not found on /queue deep link
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › startWorkOrder** [other] — Button matching /start|begin work|check in/i not visible
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › completeWorkOrder** [other] — Complete button not visible after lifecycle
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › openBell** [missing_ui] — Notification bell not visible in header
  - URL: `https://joblineai.lovable.app/dashboard`
  - Fix: Check Header/AppShell — NotificationBell render condition.
- **smoke-matrix › openWorkOrder** [other] — WO E2E-WO-001 not found on /queue deep link
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › startWorkOrder** [other] — Button matching /start|begin work|check in/i not visible
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › completeWorkOrder** [other] — Complete button not visible after lifecycle
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › openBell** [missing_ui] — Notification bell not visible in header
  - URL: `https://joblineai.lovable.app/dashboard`
  - Fix: Check Header/AppShell — NotificationBell render condition.
- **smoke-matrix › passToNextStep** [missing_ui] — 'Next operation' CTA not visible for E2E-WO-001
  - URL: `https://joblineai.lovable.app/queue?item=E2E-WO-001`
  - Fix: Verify pass_work_order_to_next_step RPC binding in WO detail.

## Warnings & concerns (305)
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=us_person_declared&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organizations?select=requires_us_person_declaration&id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/work_center_config?select=*&order=sort_order.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/teams?select=*&order=created_at.desc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useUSPersonDeclaration] Error checking status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…eai.lovable.app/assets/index-DgJTPYSR.js:81:67372, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › pauseWorkOrder** [other] — Button matching /pause|hold|on hold/i not visible
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › resumeWorkOrder** [other] — Button matching /resume|continue|restart/i not visible
  - URL: `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/exceljs.min-Sea8VoKZ.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › openHandoffPage** [missing_ui] — No 'New Handoff' CTA on /dashboard station cards
  - URL: `https://joblineai.lovable.app/dashboard`
  - Fix: Add data-testid=new-handoff to station-card handoff trigger.
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/app_settings?select=*&order=setting_key.asc — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/user_onboarding?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/notification_preferences?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/team_members?select=id%2Cteam_id%2Crole%2Cjoined_at%2Cteams%3Ateam_id%28id%2Cname%2Cdescription%29&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/exceljs.min-Sea8VoKZ.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/teams?select=*&order=created_at.desc — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — POST https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/activity_logs — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/user_roles?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organization_members?select=id%2Corganization_id%2Crole%2Cjoined_at%2Corganizations%3Aorganization_id%28id%2Cname%2Cslug%2Cdescription%2Clogo_url%2Csubscription_tier%2Csubscription_status%2Ctrial_ends_at%2Crequires_us_person_declaration%29&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/work_center_config?select=*&order=sort_order.asc — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — Error fetching settings: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…eai.lovable.app/assets/index-DgJTPYSR.js:81:12774, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — Error fetching onboarding state: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…eai.lovable.app/assets/index-DgJTPYSR.js:32:6712), hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › openNcrForm** [missing_ui] — No 'Report NCR' CTA visible from /queue or WO drawer
  - URL: `https://joblineai.lovable.app/queue`
  - Fix: Add data-testid=ncr-create to WO drawer's NCR trigger button.
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organizations?select=requires_us_person_declaration&id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organizations?select=mfa_required&id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/shift_schedules?select=*&order=start_time.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=rob_accepted_at%2Crob_version&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/teams?select=*&order=created_at.desc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/work_center_config?select=*&order=sort_order.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/exceljs.min-Sea8VoKZ.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=us_person_declared&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useMFAEnforcement] Error checking MFA status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useRulesOfBehavior] Error checking RoB status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…ineai.lovable.app/assets/index-DgJTPYSR.js:95:365, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useUSPersonDeclaration] Error checking status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/exceljs.min-Sea8VoKZ.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/Header-B60O1Hxo.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=rob_accepted_at%2Crob_version&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useRulesOfBehavior] Error checking RoB status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/AlarmFeed-C345cfKe.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/shift_schedules?select=*&order=start_time.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/StationMachineContextDialog-DUHtXGlM.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=rob_accepted_at%2Crob_version&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=us_person_declared&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/work_center_config?select=*&order=sort_order.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/vendor-markdown-DlcFVF3P.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/PartSpecsSection-C_yPfdv9.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/CreateWorkOrderDialog-CtTFu_Ad.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organizations?select=requires_us_person_declaration&id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/teams?select=*&order=created_at.desc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/MachineProfileMarketplace-2l7RFUOC.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/dashboard`

_…and 255 more_

## Console / network issues (280)
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=us_person_declared&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organizations?select=requires_us_person_declaration&id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/work_center_config?select=*&order=sort_order.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/teams?select=*&order=created_at.desc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useUSPersonDeclaration] Error checking status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…eai.lovable.app/assets/index-DgJTPYSR.js:81:67372, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/exceljs.min-Sea8VoKZ.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/app_settings?select=*&order=setting_key.asc — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/user_onboarding?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/notification_preferences?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/team_members?select=id%2Cteam_id%2Crole%2Cjoined_at%2Cteams%3Ateam_id%28id%2Cname%2Cdescription%29&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/exceljs.min-Sea8VoKZ.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/teams?select=*&order=created_at.desc — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — POST https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/activity_logs — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/user_roles?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=*&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organization_members?select=id%2Corganization_id%2Crole%2Cjoined_at%2Corganizations%3Aorganization_id%28id%2Cname%2Cslug%2Cdescription%2Clogo_url%2Csubscription_tier%2Csubscription_status%2Ctrial_ends_at%2Crequires_us_person_declaration%29&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/work_center_config?select=*&order=sort_order.asc — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — Error fetching settings: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…eai.lovable.app/assets/index-DgJTPYSR.js:81:12774, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — Error fetching onboarding state: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…eai.lovable.app/assets/index-DgJTPYSR.js:32:6712), hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organizations?select=requires_us_person_declaration&id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/organizations?select=mfa_required&id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/shift_schedules?select=*&order=start_time.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=rob_accepted_at%2Crob_version&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/teams?select=*&order=created_at.desc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/work_center_config?select=*&order=sort_order.asc&organization_id=eq.f12d7de3-e035-4a7d-8322-6c96fb70d766 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://joblineai.lovable.app/assets/exceljs.min-Sea8VoKZ.js — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › requestfailed** [data] — GET https://dpajcbhfwmfnzgldrveu.supabase.co/rest/v1/profiles?select=us_person_declared&user_id=eq.99161b8b-b294-4840-b85f-11ac39fe2076 — net::ERR_ABORTED
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useMFAEnforcement] Error checking MFA status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useRulesOfBehavior] Error checking RoB status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at https://joblinea…ineai.lovable.app/assets/index-DgJTPYSR.js:95:365, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`
- **smoke-matrix › console.error** [other] — [useUSPersonDeclaration] Error checking status: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch, hint: , code: }
  - URL: `https://joblineai.lovable.app/setup`

_…and 250 more_

## Routes touched (24)
- `/`
- `/auth`
- `/dashboard`
- `/gca`
- `/gcode-academy`
- `/handbook`
- `/handoff`
- `/manufacturing-visibility`
- `/notifications`
- `/oap`
- `/operator-tools`
- `/pricing`
- `/queue`
- `/resources`
- `/resources/gcode`
- `/resources/glossary`
- `/setup`
- `/shift-handoff`
- `/talent`
- `/talent/browse`
- `/teams`
- `/this-route-definitely-does-not-exist-12345`
- `/work-orders`
- `/work-orders/cancelled`

## Categories
- **data**: 212
- **other**: 78
- **missing_ui**: 24
- **auth**: 2
- **dead_end**: 2
