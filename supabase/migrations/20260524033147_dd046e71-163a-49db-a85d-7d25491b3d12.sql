
-- =============================================================
-- Admin Platform Operations Phase 2-5 — consolidated idempotent apply
-- Source files: 20260523120001 .. 20260523120006
-- =============================================================

-- ---------- Phase 2: Policy Acceptance Ledger ----------
CREATE TABLE IF NOT EXISTS public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL CHECK (policy_type IN ('terms','privacy','cookies','billing','combined')),
  version_label text NOT NULL,
  title text NOT NULL,
  summary text,
  change_highlights text[] DEFAULT '{}',
  full_policy_url text,
  effective_date date NOT NULL,
  approval_state text NOT NULL DEFAULT 'draft' CHECK (approval_state IN ('draft','in_review','approved','published','archived')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  linked_announcement_id uuid REFERENCES public.policy_change_announcements(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage policy versions" ON public.policy_versions;
CREATE POLICY "Platform admins manage policy versions" ON public.policy_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users read published policy versions" ON public.policy_versions;
CREATE POLICY "Users read published policy versions" ON public.policy_versions FOR SELECT TO authenticated
  USING (approval_state = 'published');
CREATE INDEX IF NOT EXISTS idx_policy_versions_policy_type ON public.policy_versions(policy_type);
CREATE INDEX IF NOT EXISTS idx_policy_versions_approval_state ON public.policy_versions(approval_state);
CREATE INDEX IF NOT EXISTS idx_policy_versions_effective_date ON public.policy_versions(effective_date DESC);

CREATE TABLE IF NOT EXISTS public.policy_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version_id uuid NOT NULL REFERENCES public.policy_versions(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  organization_id uuid REFERENCES public.organizations(id),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  acceptance_method text NOT NULL DEFAULT 'explicit_click' CHECK (acceptance_method IN ('explicit_click','implicit_scroll','api'))
);
ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins read all policy acceptances" ON public.policy_acceptances;
CREATE POLICY "Platform admins read all policy acceptances" ON public.policy_acceptances FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users insert own acceptance" ON public.policy_acceptances;
CREATE POLICY "Users insert own acceptance" ON public.policy_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own acceptances" ON public.policy_acceptances;
CREATE POLICY "Users read own acceptances" ON public.policy_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user_id ON public.policy_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_version_id ON public.policy_acceptances(policy_version_id);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_accepted_at ON public.policy_acceptances(accepted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_acceptances_unique ON public.policy_acceptances(policy_version_id, user_id);

-- ---------- Phase 2: Billing Back-Office ----------
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  event_type text NOT NULL CHECK (event_type IN (
    'seat_change','credit_applied','complimentary_access','payment_failed','payment_recovered',
    'plan_change','cancellation','renewal','downgrade','upgrade','manual_adjustment'
  )),
  description text NOT NULL,
  amount_cents integer,
  currency text DEFAULT 'usd',
  seat_delta integer,
  previous_value text,
  new_value text,
  reason text,
  reference_id text,
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage billing events" ON public.billing_events;
CREATE POLICY "Platform admins manage billing events" ON public.billing_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_billing_events_organization_id ON public.billing_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_type ON public.billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON public.billing_events(created_at DESC);

CREATE TABLE IF NOT EXISTS public.billing_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  note text NOT NULL,
  note_type text NOT NULL DEFAULT 'general' CHECK (note_type IN ('general','payment_exception','contract','churn_risk','vip','collection')),
  is_pinned boolean NOT NULL DEFAULT false,
  authored_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage billing notes" ON public.billing_notes;
CREATE POLICY "Platform admins manage billing notes" ON public.billing_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_billing_notes_organization_id ON public.billing_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_notes_note_type ON public.billing_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_billing_notes_created_at ON public.billing_notes(created_at DESC);

-- ---------- Phase 2: Email Operations ----------
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('legal','transactional','recruiting','marketing','system')),
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  send_requires_approval boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage email templates" ON public.email_templates;
CREATE POLICY "Platform admins manage email templates" ON public.email_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

CREATE TABLE IF NOT EXISTS public.email_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  recipient_email text NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id),
  template_id uuid REFERENCES public.email_templates(id),
  category text CHECK (category IN ('legal','transactional','recruiting','marketing','system')),
  status text NOT NULL CHECK (status IN ('sent','delivered','bounced','complained','suppressed','failed','opened','clicked')),
  provider text,
  provider_event_id text,
  error_message text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_delivery_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage delivery events" ON public.email_delivery_events;
CREATE POLICY "Platform admins manage delivery events" ON public.email_delivery_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_email_delivery_status ON public.email_delivery_events(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_occurred_at ON public.email_delivery_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_delivery_recipient ON public.email_delivery_events(recipient_email);

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text NOT NULL CHECK (reason IN ('bounce','complaint','unsubscribe','manual')),
  suppressed_at timestamptz NOT NULL DEFAULT now(),
  suppressed_by uuid REFERENCES auth.users(id),
  notes text
);
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage suppressions" ON public.email_suppressions;
CREATE POLICY "Platform admins manage suppressions" ON public.email_suppressions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON public.email_suppressions(email);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_reason ON public.email_suppressions(reason);

-- ---------- Phase 3: Admin Audit Log ----------
CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  actor_email text,
  event_category text NOT NULL CHECK (event_category IN ('legal','billing','org','support','security','talent','system')),
  event_action text NOT NULL,
  target_type text,
  target_id text,
  target_label text,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  organization_id uuid REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users insert audit events" ON public.admin_audit_events;
CREATE POLICY "Authenticated users insert audit events" ON public.admin_audit_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);
DROP POLICY IF EXISTS "Platform admins read audit events" ON public.admin_audit_events;
CREATE POLICY "Platform admins read audit events" ON public.admin_audit_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_id ON public.admin_audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_event_category ON public.admin_audit_events(event_category);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_organization_id ON public.admin_audit_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_events(target_type, target_id);

-- ---------- Phase 4: Talent Governance ----------
CREATE TABLE IF NOT EXISTS public.talent_outreach_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  consent_type text NOT NULL CHECK (consent_type IN ('recruiter_contact','profile_visibility','resume_download','pipeline_add')),
  consented boolean NOT NULL DEFAULT true,
  consented_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  notes text
);
ALTER TABLE public.talent_outreach_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage outreach consents" ON public.talent_outreach_consents;
CREATE POLICY "Platform admins manage outreach consents" ON public.talent_outreach_consents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users manage own consents" ON public.talent_outreach_consents;
CREATE POLICY "Users manage own consents" ON public.talent_outreach_consents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_talent_consents_user_id ON public.talent_outreach_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_consents_type ON public.talent_outreach_consents(consent_type);

CREATE TABLE IF NOT EXISTS public.recruiter_messaging_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  daily_limit integer NOT NULL DEFAULT 20,
  weekly_limit integer NOT NULL DEFAULT 80,
  is_suspended boolean NOT NULL DEFAULT false,
  suspension_reason text,
  suspended_by uuid REFERENCES auth.users(id),
  suspended_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recruiter_messaging_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage recruiter limits" ON public.recruiter_messaging_limits;
CREATE POLICY "Platform admins manage recruiter limits" ON public.recruiter_messaging_limits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_recruiter_limits_org ON public.recruiter_messaging_limits(organization_id);

CREATE TABLE IF NOT EXISTS public.talent_abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  reported_organization_id uuid REFERENCES public.organizations(id),
  report_type text NOT NULL CHECK (report_type IN ('unsolicited_contact','harassment','data_misuse','fake_opportunity','other')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','dismissed')),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_abuse_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage abuse reports" ON public.talent_abuse_reports;
CREATE POLICY "Platform admins manage abuse reports" ON public.talent_abuse_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users insert own abuse reports" ON public.talent_abuse_reports;
CREATE POLICY "Users insert own abuse reports" ON public.talent_abuse_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_talent_abuse_status ON public.talent_abuse_reports(status);
CREATE INDEX IF NOT EXISTS idx_talent_abuse_created_at ON public.talent_abuse_reports(created_at DESC);

-- ---------- Phase 5: Platform Support & Executive Reporting ----------
CREATE TABLE IF NOT EXISTS public.org_support_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  note_type text NOT NULL DEFAULT 'general' CHECK (note_type IN ('general','escalation','churn_risk','success','implementation','legal','billing')),
  body text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  authored_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_support_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage org support notes" ON public.org_support_notes;
CREATE POLICY "Platform admins manage org support notes" ON public.org_support_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_org_support_notes_org_id ON public.org_support_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_support_notes_type ON public.org_support_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_org_support_notes_created_at ON public.org_support_notes(created_at DESC);

CREATE TABLE IF NOT EXISTS public.org_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  snapshot_date date NOT NULL DEFAULT current_date,
  active_user_count integer,
  work_order_count_30d integer,
  last_active_at timestamptz,
  subscription_tier text,
  seat_utilization_pct numeric(5,2),
  has_past_due_invoice boolean NOT NULL DEFAULT false,
  policy_acceptance_pct numeric(5,2),
  risk_flags text[] DEFAULT '{}',
  health_score numeric(4,1),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_health_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins manage org health snapshots" ON public.org_health_snapshots;
CREATE POLICY "Platform admins manage org health snapshots" ON public.org_health_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_org_health_org_id ON public.org_health_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_health_snapshot_date ON public.org_health_snapshots(snapshot_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_health_unique ON public.org_health_snapshots(organization_id, snapshot_date);
