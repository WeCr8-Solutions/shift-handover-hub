-- =============================================
-- MULTI-TENANT SAAS ARCHITECTURE
-- =============================================

-- 1. Create organizations table (top-level tenant)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  billing_email TEXT,
  subscription_status TEXT DEFAULT 'trial',
  subscription_tier TEXT DEFAULT 'free',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Add organization_id to teams
ALTER TABLE public.teams 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 4. Create work order routing table for multi-step flows
CREATE TABLE public.work_order_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES public.queue_items(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  station_id UUID REFERENCES public.stations(id),
  operation_type TEXT NOT NULL DEFAULT 'internal' CHECK (operation_type IN ('internal', 'outside_processing', 'inspection', 'shipping')),
  operation_name TEXT NOT NULL,
  estimated_duration INTEGER, -- in minutes
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  outside_vendor TEXT, -- for outside processing
  po_number TEXT, -- for outside processing
  expected_return_date DATE, -- for outside processing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (queue_item_id, step_number)
);

ALTER TABLE public.work_order_routing ENABLE ROW LEVEL SECURITY;

-- 5. Create routing templates for reusable flows
CREATE TABLE public.routing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  part_number_pattern TEXT, -- optional pattern matching for auto-apply
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.routing_templates ENABLE ROW LEVEL SECURITY;

-- 6. Routing template steps
CREATE TABLE public.routing_template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.routing_templates(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  operation_type TEXT NOT NULL DEFAULT 'internal',
  operation_name TEXT NOT NULL,
  work_center_type TEXT,
  estimated_duration INTEGER,
  instructions TEXT,
  UNIQUE (template_id, step_number)
);

ALTER TABLE public.routing_template_steps ENABLE ROW LEVEL SECURITY;

-- 7. Add organization_id to queue_items for direct isolation
ALTER TABLE public.queue_items 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 8. Add organization_id to stations
ALTER TABLE public.stations 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Check if user is admin of organization
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =============================================
-- RLS POLICIES FOR ORGANIZATIONS
-- =============================================

-- Organizations: members can view their org
CREATE POLICY "Org members can view their organization"
ON public.organizations FOR SELECT
USING (is_org_member(auth.uid(), id));

-- Organizations: only owners can update
CREATE POLICY "Org admins can update organization"
ON public.organizations FOR UPDATE
USING (is_org_admin(auth.uid(), id));

-- Organizations: authenticated users can create
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Organization members: members can view other members
CREATE POLICY "Org members can view membership"
ON public.organization_members FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

-- Organization members: admins can add members
CREATE POLICY "Org admins can add members"
ON public.organization_members FOR INSERT
WITH CHECK (is_org_admin(auth.uid(), organization_id) OR auth.uid() = user_id);

-- Organization members: admins can update roles
CREATE POLICY "Org admins can update member roles"
ON public.organization_members FOR UPDATE
USING (is_org_admin(auth.uid(), organization_id));

-- Organization members: admins can remove members
CREATE POLICY "Org admins can remove members"
ON public.organization_members FOR DELETE
USING (is_org_admin(auth.uid(), organization_id) OR auth.uid() = user_id);

-- =============================================
-- RLS POLICIES FOR WORK ORDER ROUTING
-- =============================================

-- Work order routing: based on queue item access
CREATE POLICY "Team members can view routing"
ON public.work_order_routing FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM queue_items qi
    WHERE qi.id = queue_item_id
    AND (qi.organization_id IS NULL OR is_org_member(auth.uid(), qi.organization_id))
  )
);

CREATE POLICY "Team members can manage routing"
ON public.work_order_routing FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM queue_items qi
    WHERE qi.id = queue_item_id
    AND (qi.organization_id IS NULL OR is_org_member(auth.uid(), qi.organization_id))
  )
);

-- =============================================
-- RLS POLICIES FOR ROUTING TEMPLATES
-- =============================================

CREATE POLICY "Org members can view templates"
ON public.routing_templates FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage templates"
ON public.routing_templates FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can view template steps"
ON public.routing_template_steps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM routing_templates rt
    WHERE rt.id = template_id
    AND is_org_member(auth.uid(), rt.organization_id)
  )
);

CREATE POLICY "Org admins can manage template steps"
ON public.routing_template_steps FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM routing_templates rt
    WHERE rt.id = template_id
    AND is_org_admin(auth.uid(), rt.organization_id)
  )
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_order_routing_updated_at
BEFORE UPDATE ON public.work_order_routing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routing_templates_updated_at
BEFORE UPDATE ON public.routing_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();