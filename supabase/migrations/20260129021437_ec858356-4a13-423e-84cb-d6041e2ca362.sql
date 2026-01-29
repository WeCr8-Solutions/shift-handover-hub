
-- =============================================
-- ESSENTIAL MISSING STRUCTURES FOR MULTI-TENANT SAAS
-- =============================================

-- 1. Delivery Requests Table (for inter-station delivery tracking)
CREATE TABLE public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES public.queue_items(id) ON DELETE SET NULL,
  routing_step_id UUID REFERENCES public.work_order_routing(id) ON DELETE SET NULL,
  from_station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  to_station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, picked_up, in_transit, delivered, cancelled
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent, critical
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  requested_by UUID,
  requested_by_name TEXT,
  picked_up_by UUID,
  picked_up_by_name TEXT,
  picked_up_at TIMESTAMPTZ,
  delivered_by UUID,
  delivered_by_name TEXT,
  delivered_at TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Shift Assignments (linking users to shifts)
CREATE TABLE public.shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shift_schedule_id UUID NOT NULL REFERENCES public.shift_schedules(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  effective_from DATE NOT NULL,
  effective_until DATE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, shift_schedule_id, effective_from)
);

-- 3. Quality Checkpoints (for QA workflow definitions)
CREATE TABLE public.quality_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  checkpoint_type TEXT NOT NULL, -- first_article, in_process, final, receiving
  required_for_work_centers TEXT[] DEFAULT '{}',
  checklist_items JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Quality Inspections (actual inspection records)
CREATE TABLE public.quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES public.queue_items(id) ON DELETE SET NULL,
  checkpoint_id UUID REFERENCES public.quality_checkpoints(id) ON DELETE SET NULL,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  inspector_id UUID,
  inspector_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, passed, failed, conditional
  results JSONB DEFAULT '{}',
  notes TEXT,
  defects_found INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Material Lots (for material tracking)
CREATE TABLE public.material_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  material_type TEXT NOT NULL,
  part_number TEXT,
  supplier TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'each',
  received_date DATE,
  expiry_date DATE,
  location TEXT,
  status TEXT DEFAULT 'available', -- available, reserved, consumed, expired, rejected
  certification_docs TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, lot_number)
);

-- 6. Notification Queue (for async notification delivery)
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  notification_type TEXT NOT NULL, -- email, push, in_app, sms
  channel TEXT NOT NULL, -- handoff, quality, delivery, maintenance
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending', -- pending, processing, sent, failed, cancelled
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. User Sessions (for session management)
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. API Request Logs (for rate limiting and auditing)
CREATE TABLE public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.organization_api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ENABLE RLS ON ALL NEW TABLES
-- =============================================

ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Delivery Requests
CREATE POLICY "Org members can view deliveries"
ON public.delivery_requests FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create deliveries"
ON public.delivery_requests FOR INSERT
WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update deliveries"
ON public.delivery_requests FOR UPDATE
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete deliveries"
ON public.delivery_requests FOR DELETE
USING (is_org_admin(auth.uid(), organization_id));

-- Shift Assignments
CREATE POLICY "Users can view own shift assignments"
ON public.shift_assignments FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM shift_schedules ss
    WHERE ss.id = shift_assignments.shift_schedule_id
    AND (is_org_admin(auth.uid(), ss.organization_id) OR is_supervisor_in_org(auth.uid(), ss.organization_id))
  )
);

CREATE POLICY "Supervisors can manage shift assignments"
ON public.shift_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM shift_schedules ss
    WHERE ss.id = shift_assignments.shift_schedule_id
    AND (is_org_admin(auth.uid(), ss.organization_id) OR is_supervisor_in_org(auth.uid(), ss.organization_id))
  )
);

-- Quality Checkpoints
CREATE POLICY "Org members can view checkpoints"
ON public.quality_checkpoints FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage checkpoints"
ON public.quality_checkpoints FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

-- Quality Inspections
CREATE POLICY "Org members can view inspections"
ON public.quality_inspections FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create inspections"
ON public.quality_inspections FOR INSERT
WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Inspectors and supervisors can update inspections"
ON public.quality_inspections FOR UPDATE
USING (
  auth.uid() = inspector_id OR
  is_supervisor_in_org(auth.uid(), organization_id) OR
  is_org_admin(auth.uid(), organization_id)
);

-- Material Lots
CREATE POLICY "Org members can view materials"
ON public.material_lots FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Supervisors can manage materials"
ON public.material_lots FOR ALL
USING (
  is_supervisor_in_org(auth.uid(), organization_id) OR
  is_org_admin(auth.uid(), organization_id)
);

-- Notification Queue
CREATE POLICY "Users can view own notifications"
ON public.notification_queue FOR SELECT
USING (auth.uid() = user_id OR is_org_admin(auth.uid(), organization_id));

-- User Sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
ON public.user_sessions FOR ALL
USING (auth.uid() = user_id);

-- API Request Logs
CREATE POLICY "Org admins can view API logs"
ON public.api_request_logs FOR SELECT
USING (is_org_admin(auth.uid(), organization_id));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_delivery_requests_org ON public.delivery_requests(organization_id);
CREATE INDEX idx_delivery_requests_status ON public.delivery_requests(status);
CREATE INDEX idx_delivery_requests_from_station ON public.delivery_requests(from_station_id);
CREATE INDEX idx_delivery_requests_to_station ON public.delivery_requests(to_station_id);
CREATE INDEX idx_delivery_requests_queue_item ON public.delivery_requests(queue_item_id);

CREATE INDEX idx_shift_assignments_user ON public.shift_assignments(user_id);
CREATE INDEX idx_shift_assignments_schedule ON public.shift_assignments(shift_schedule_id);
CREATE INDEX idx_shift_assignments_station ON public.shift_assignments(station_id);

CREATE INDEX idx_quality_checkpoints_org ON public.quality_checkpoints(organization_id);
CREATE INDEX idx_quality_checkpoints_type ON public.quality_checkpoints(checkpoint_type);

CREATE INDEX idx_quality_inspections_org ON public.quality_inspections(organization_id);
CREATE INDEX idx_quality_inspections_queue_item ON public.quality_inspections(queue_item_id);
CREATE INDEX idx_quality_inspections_status ON public.quality_inspections(status);

CREATE INDEX idx_material_lots_org ON public.material_lots(organization_id);
CREATE INDEX idx_material_lots_lot_number ON public.material_lots(lot_number);
CREATE INDEX idx_material_lots_status ON public.material_lots(status);

CREATE INDEX idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX idx_notification_queue_user ON public.notification_queue(user_id);
CREATE INDEX idx_notification_queue_scheduled ON public.notification_queue(scheduled_for);

CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_org ON public.user_sessions(organization_id);

CREATE INDEX idx_api_logs_org ON public.api_request_logs(organization_id);
CREATE INDEX idx_api_logs_created ON public.api_request_logs(created_at DESC);
CREATE INDEX idx_api_logs_api_key ON public.api_request_logs(api_key_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_delivery_requests_updated_at
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_assignments_updated_at
  BEFORE UPDATE ON public.shift_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_checkpoints_updated_at
  BEFORE UPDATE ON public.quality_checkpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_inspections_updated_at
  BEFORE UPDATE ON public.quality_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_lots_updated_at
  BEFORE UPDATE ON public.material_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
