
-- =====================================================
-- ADDITIONAL MULTI-TENANT SAAS STRUCTURES (FIXED)
-- Manufacturing-focused + General SaaS essentials
-- =====================================================

-- 1. ANNOUNCEMENTS - Org/team-wide announcements and alerts
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal',
  announcement_type text DEFAULT 'info',
  is_pinned boolean DEFAULT false,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ANNOUNCEMENT READ STATUS
CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- 3. USER ORG PREFERENCES
CREATE TABLE public.user_org_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  default_station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL,
  dashboard_layout jsonb DEFAULT '{}',
  sidebar_collapsed boolean DEFAULT false,
  theme_preference text DEFAULT 'system',
  timezone text DEFAULT 'UTC',
  locale text DEFAULT 'en-US',
  notifications_muted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- 4. ORG BRANDING - White-label customization
CREATE TABLE public.organization_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#64748b',
  accent_color text DEFAULT '#f59e0b',
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  custom_css text,
  email_header_html text,
  email_footer_html text,
  login_background_url text,
  company_tagline text,
  support_email text,
  support_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. EQUIPMENT/ASSETS
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  asset_tag text NOT NULL,
  name text NOT NULL,
  description text,
  equipment_type text NOT NULL,
  manufacturer text,
  model text,
  serial_number text,
  purchase_date date,
  warranty_expires date,
  status text DEFAULT 'available',
  location text,
  calibration_due date,
  last_calibration date,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, asset_tag)
);

-- 6. MAINTENANCE RECORDS
CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE CASCADE,
  station_id uuid REFERENCES public.stations(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_date date,
  completed_date date,
  performed_by uuid,
  performed_by_name text,
  status text DEFAULT 'scheduled',
  cost decimal(10,2),
  parts_used jsonb DEFAULT '[]',
  notes text,
  next_due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. OPERATOR CERTIFICATIONS
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  required_for_work_centers text[] DEFAULT '{}',
  validity_period_days integer,
  requires_renewal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- 8. USER CERTIFICATIONS
CREATE TABLE public.user_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  issued_date date NOT NULL,
  expires_date date,
  status text DEFAULT 'active',
  issued_by uuid,
  issued_by_name text,
  certificate_number text,
  notes text,
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, certification_id)
);

-- 9. DOWNTIME EVENTS (without generated column - will calculate in queries)
CREATE TABLE public.downtime_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  downtime_type text NOT NULL,
  reason_code text,
  description text,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_minutes integer, -- calculated on update/insert via trigger
  reported_by uuid,
  reported_by_name text,
  resolved_by uuid,
  resolved_by_name text,
  resolution_notes text,
  work_order_id uuid REFERENCES public.queue_items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. SAVED FILTERS/VIEWS
CREATE TABLE public.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  view_type text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  columns jsonb DEFAULT '[]',
  sort_by jsonb DEFAULT '{}',
  is_default boolean DEFAULT false,
  is_shared boolean DEFAULT false,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. DATA EXPORT REQUESTS - GDPR compliance
CREATE TABLE public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  export_type text NOT NULL,
  status text DEFAULT 'pending',
  file_url text,
  file_expires_at timestamptz,
  error_message text,
  filters jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 12. TERMS ACCEPTANCE
CREATE TABLE public.terms_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  terms_type text NOT NULL,
  accepted_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  UNIQUE(user_id, organization_id, terms_type, terms_version)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_org_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Announcements
CREATE POLICY "Org members can view announcements"
ON public.announcements FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage announcements"
ON public.announcements FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Supervisors can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (is_supervisor_in_org(auth.uid(), organization_id));

-- Announcement reads
CREATE POLICY "Users can manage own read status"
ON public.announcement_reads FOR ALL
USING (auth.uid() = user_id);

-- User org preferences
CREATE POLICY "Users can manage own org preferences"
ON public.user_org_preferences FOR ALL
USING (auth.uid() = user_id AND is_org_member(auth.uid(), organization_id));

-- Org branding
CREATE POLICY "Org members can view branding"
ON public.organization_branding FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage branding"
ON public.organization_branding FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

-- Equipment
CREATE POLICY "Org members can view equipment"
ON public.equipment FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage equipment"
ON public.equipment FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Supervisors can manage equipment"
ON public.equipment FOR ALL
USING (is_supervisor_in_org(auth.uid(), organization_id));

-- Maintenance records
CREATE POLICY "Org members can view maintenance"
ON public.maintenance_records FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Supervisors can manage maintenance"
ON public.maintenance_records FOR ALL
USING (is_supervisor_in_org(auth.uid(), organization_id) OR is_org_admin(auth.uid(), organization_id));

-- Certifications
CREATE POLICY "Org members can view certifications"
ON public.certifications FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage certifications"
ON public.certifications FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

-- User certifications
CREATE POLICY "Org members can view user certifications"
ON public.user_certifications FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view own certifications"
ON public.user_certifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Supervisors can manage user certifications"
ON public.user_certifications FOR ALL
USING (is_supervisor_in_org(auth.uid(), organization_id) OR is_org_admin(auth.uid(), organization_id));

-- Downtime events
CREATE POLICY "Org members can view downtime"
ON public.downtime_events FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can report downtime"
ON public.downtime_events FOR INSERT
WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Supervisors can manage downtime"
ON public.downtime_events FOR UPDATE
USING (is_supervisor_in_org(auth.uid(), organization_id) OR is_org_admin(auth.uid(), organization_id));

-- Saved views
CREATE POLICY "Users can manage own saved views"
ON public.saved_views FOR ALL
USING (auth.uid() = user_id AND is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view shared team views"
ON public.saved_views FOR SELECT
USING (is_shared = true AND team_id IS NOT NULL AND is_team_member(auth.uid(), team_id));

-- Data export requests
CREATE POLICY "Users can view own export requests"
ON public.data_export_requests FOR SELECT
USING (auth.uid() = requested_by);

CREATE POLICY "Org admins can view org exports"
ON public.data_export_requests FOR SELECT
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can request exports"
ON public.data_export_requests FOR INSERT
WITH CHECK (auth.uid() = requested_by AND is_org_member(auth.uid(), organization_id));

-- Terms acceptance
CREATE POLICY "Users can manage own terms acceptance"
ON public.terms_acceptance FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Org admins can view org terms acceptance"
ON public.terms_acceptance FOR SELECT
USING (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id));

-- =====================================================
-- TRIGGER for downtime duration calculation
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_downtime_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  ELSE
    NEW.duration_minutes := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_calculate_downtime_duration
BEFORE INSERT OR UPDATE ON public.downtime_events
FOR EACH ROW
EXECUTE FUNCTION public.calculate_downtime_duration();

-- =====================================================
-- INDEXES (without now() in predicates)
-- =====================================================
CREATE INDEX idx_announcements_org ON public.announcements(organization_id);
CREATE INDEX idx_announcements_dates ON public.announcements(organization_id, starts_at, expires_at);
CREATE INDEX idx_announcement_reads_user ON public.announcement_reads(user_id);
CREATE INDEX idx_user_org_prefs ON public.user_org_preferences(user_id, organization_id);
CREATE INDEX idx_equipment_org ON public.equipment(organization_id);
CREATE INDEX idx_equipment_station ON public.equipment(station_id);
CREATE INDEX idx_equipment_status ON public.equipment(organization_id, status);
CREATE INDEX idx_maintenance_org ON public.maintenance_records(organization_id);
CREATE INDEX idx_maintenance_equipment ON public.maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_records(organization_id, status, next_due_date);
CREATE INDEX idx_certifications_org ON public.certifications(organization_id);
CREATE INDEX idx_user_certs_user ON public.user_certifications(user_id);
CREATE INDEX idx_user_certs_status ON public.user_certifications(organization_id, status, expires_date);
CREATE INDEX idx_downtime_org ON public.downtime_events(organization_id);
CREATE INDEX idx_downtime_station ON public.downtime_events(station_id);
CREATE INDEX idx_downtime_dates ON public.downtime_events(organization_id, started_at, ended_at);
CREATE INDEX idx_saved_views_user ON public.saved_views(user_id, organization_id);
CREATE INDEX idx_data_exports_user ON public.data_export_requests(requested_by);
CREATE INDEX idx_terms_user ON public.terms_acceptance(user_id);
