## Audit findings — what blocks "production-ready on first login"

The concierge plumbing exists (engagement, checklist, splash, Stripe checkout, activation RPC), but several **silent-failure** gaps mean an org can be flipped to `live` while still being functionally empty. Cleared in order of severity:

### Critical gaps

1. **Uploads never parse into the database.** `UploadUtility` only drops the CSV/XLSX into the `onboarding-documents` storage bucket. Nothing inserts rows into `equipment`, `stations`, `departments`, `organization_invites`, `routing_templates`, `quality_checkpoints`, or `oap_role_programs`. A platform admin can mark every checklist item "Done" while the org has 0 machines, 0 stations, 0 users → customer logs in to a blank app, no KPIs possible.
2. **`mark_engagement_ready` only checks checklist booleans, not data presence.** It should fail if the org has 0 stations, 0 active members, no subscription, no branding, or (for non-ITAR orgs that chose ERP) no `erp_connections` row. Currently nothing prevents flipping an empty org to `ready_for_production`.
3. **Several modules have no `templateColumns`.** `org_profile`, `quality`, `erp`, `documents`, `review` show no upload UI at all. Existing templates are also thin (equipment missing `serial_number`/`controller_family`/`machine_type`, users missing `team`/`send_invite_now`, routing missing dimension/quality columns).
4. **Required vs optional mismatch.** `training` and `erp` are `required=false`, but without users + assigned OAP role programs there is zero operator activity → zero KPI signal. Training should be required.
5. **Subscription tier is never verified.** Concierge is a $1,500 one-time fee; the org still needs an active `subscriptions` row (single/team/enterprise) for entitlements. Activation today doesn't check this — the customer logs in and immediately hits paywalls.
6. **No customer-facing kickoff email** after Stripe payment, and **no internal notification** to JobLine team that an engagement was created.
7. **`/setup` self-serve is not gated.** A customer mid-concierge can race the JobLine team by starting parallel setup. Splash blocks the dashboard but not `/setup`.
8. **Splash over-blocks `ready_for_production`.** Org admins should be allowed to log in for the final walkthrough; only operators should stay blocked.

### Day-one KPI gaps (causes empty dashboards on activation)

9. **No baseline `current_station_status` rows.** Floor Map + KPI cards render zeros because no station has ever emitted a status. Need to seed `idle` for every station at activation.
10. **No baseline org defaults.** `org_downtime_reasons`, default shift schedule, work-center config, notification thresholds, and morning brief recipient list are all empty — the `morning-brief-cron` and notifications send nothing.
11. **No data audit at activation.** Customer can't see a "what was set up for you" report on first login.
12. **Checklist completions are not audited.** Status changes go through client-side RLS; for SOC every transition should land in `admin_audit_events`.

---

## Plan (build mode)

### A. Database — `supabase/migrations/<ts>_concierge_readiness.sql`

1. **Production readiness check RPC** `public.verify_org_production_ready(p_org_id uuid) returns jsonb` (SECURITY DEFINER, admin/developer only). Returns `{ ready: bool, blockers: [...] }` and counts:
   - `>= 1` department, `>= 1` station, `>= 1` equipment row
   - `>= 1` active org admin + `>= 1` operator member
   - `>= 1` routing_template with steps
   - `>= 1` quality_checkpoint (or explicit "skip quality" flag in org_profile)
   - `subscriptions.status IN ('active','trialing')`
   - `organization_branding` row exists
   - ITAR orgs: `requires_us_person_declaration` set and `erp_persistence_mode='read_through'`
   - Non-ITAR orgs that selected ERP: `erp_connections` row exists
2. **Strengthen `mark_engagement_ready`** to call `verify_org_production_ready` and refuse if `ready=false`, returning the blocker list in the error.
3. **`seed_org_production_defaults(p_org_id uuid)`** SECURITY DEFINER — called by `activate_org_for_production`:
   - Insert `current_station_status` (`idle`) for every station that has none.
   - Insert default `org_downtime_reasons` (Tooling, Material, Maintenance, Setup, Quality Hold, Other) if table empty for org.
   - Insert default `shift_schedules` (Day 06:00–14:30, Swing 14:00–22:30) if none.
   - Insert default `notification_preferences` row for every org admin.
   - Insert default `work_center_config` rows for every distinct station type.
4. **Audit trigger** on `onboarding_checklist_items` → inserts `admin_audit_events('onboarding.checklist_item_updated', …)` on status change.
5. **Mark `training` required** in `seed_onboarding_checklist` (it's the only path to OAP role assignments).
6. Storage RLS sanity: confirm platform admin can `INSERT` into `onboarding-documents` (current policies are SELECT-only); add the missing INSERT/UPDATE/DELETE policy scoped to platform admin role.

### B. Edge function — `supabase/functions/onboarding-bulk-import/index.ts` (new)

Single entry point the admin upload utility calls after writing the storage file. Body: `{ engagement_id, module_key, storage_path, dry_run }`. JWT-verified, gated to `has_role('admin'|'developer')`. Validates and inserts into the right table per `module_key`:

- `equipment` → `equipment` (idempotent on `(org_id, asset_tag)`)
- `stations` → `departments` (upsert) + `stations` (idempotent on `(org_id, name)`)
- `users_roles` → `organization_invites` with `send_invite_now` flag; can dispatch invite emails via existing `send-email`
- `routing` → `routing_templates` + `routing_template_steps`
- `training` → `oap_role_program_courses` enrollments

Returns `{ inserted, skipped, errors[] }`. **Dry-run mode** validates without writing so the admin sees a preview before committing. Logs the import to `admin_audit_events`.

### C. Frontend — `UploadUtility` and module templates

- After upload, call `onboarding-bulk-import` with `dry_run=true`; show a preview dialog with row counts + errors, then re-call with `dry_run=false` when the admin clicks "Import".
- Fill in missing `templateColumns` for all 10 modules and expand existing ones to match the real schemas (equipment +`serial_number`,`controller_family`,`machine_type`,`hours_meter`; users +`team`,`phone`,`send_invite_now`; routing +`dimension_spec`,`quality_checkpoint`).
- New **"Live data" panel** in `EngagementDetail` calling `verify_org_production_ready` so admins see real counts (machines, users, routing templates, subscription tier, ITAR posture) — not just checklist booleans.
- "Mark ready" button disabled until both required-checklist-done **and** `verify_org_production_ready.ready=true`; show the blocker list inline.

### D. Activation + customer experience

- `activate_org_for_production` now also runs `seed_org_production_defaults` and dispatches a customer kickoff email via `send-email` ("Your facility is live — here's what we set up for you" with counts + a deep link to `/dashboard`).
- New `OnboardingSummaryCard` shown once on `/dashboard` after `onboarding_status` flips to `live` (dismissable, stored on `user_org_preferences`).
- Update `ConciergeInProgressSplash`: allow members with `is_org_admin` to pass during `ready_for_production` (operators stay blocked until `live`).
- Add a `<Navigate to="/onboarding-status" />` guard on `/setup` while engagement is active so customers don't race the team. Add a tiny `/onboarding-status` page showing percent complete + ETA.
- `stripe-webhook` concierge branch: after creating engagement, post a notification to platform admins (insert into `announcements` scoped to admin role, plus `send-email` to the JobLine onboarding inbox via the `noreply@jobline.ai` sender).

### E. Stripe / billing safety

- `create-concierge-checkout` validates the org has either an active subscription or also bundles the customer's chosen tier into the same checkout (extra line item). Until tier resolution is decided, just refuse checkout with a clear "Pick a subscription tier first" error and link to `/pricing`.

### F. E2E — `e2e/concierge-readiness.spec.ts` (extend existing spec)

1. Marketing page renders + CTA (already covered).
2. **Dry-run import preview**: upload a sample equipment CSV, expect preview dialog with row counts.
3. **Activation blocked** when `verify_org_production_ready` reports blockers (mock via seeded fixture lacking stations).
4. **Activation succeeds** with seeded fixture → org flips to `live`, `current_station_status` rows exist for every station, default downtime reasons seeded, kickoff email enqueued (assert via `email_send_log`).
5. **Splash behaviour**: operator blocked during `ready_for_production`, org admin passes.
6. `/setup` redirects to `/onboarding-status` while engagement active.

### Out of scope (call out, do not build)

- White-label customer onboarding portal (customers self-uploading their own data).
- Replacing self-serve `/setup` — concierge is a parallel path, not a rewrite.
- Multi-engagement-per-org workflows.
- Stripe subscription auto-selection (we'll require the customer to pick a tier first; bundling can come later).

### Verification

- `verify_org_production_ready` returns `ready=true` for a seeded fixture org and `ready=false` with itemized blockers for an empty org.
- Dry-run CSV import for equipment, stations, users, routing all report correct counts without writing.
- After activation: `SELECT COUNT(*) FROM current_station_status WHERE organization_id=$1` equals station count; `org_downtime_reasons` ≥ 6; `email_send_log` shows the kickoff message queued.
- Customer login as operator while `ready_for_production` still shows splash; login as org admin loads dashboard with KPI cards rendering non-zero counts (Idle = station count, Running/Setup/Down = 0).
- E2E spec passes in CI.
