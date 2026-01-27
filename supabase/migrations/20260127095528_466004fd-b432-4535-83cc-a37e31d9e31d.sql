-- Create app_settings table for organization-level settings
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  setting_type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(organization_id, team_id, setting_key)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies for app_settings
CREATE POLICY "Org admins can manage org settings"
  ON public.app_settings FOR ALL
  USING (
    (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Team admins can manage team settings"
  ON public.app_settings FOR ALL
  USING (
    (team_id IS NOT NULL AND is_team_admin(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Members can view settings"
  ON public.app_settings FOR SELECT
  USING (
    (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
    OR (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'supervisor'::app_role)
  );

-- Create shift_schedules table
CREATE TABLE public.shift_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  shift_name TEXT NOT NULL,
  shift_code TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view shifts"
  ON public.shift_schedules FOR SELECT
  USING (
    (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
    OR (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage shifts"
  ON public.shift_schedules FOR ALL
  USING (
    (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
    OR (team_id IS NOT NULL AND is_team_admin(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_handoff_alerts BOOLEAN DEFAULT true,
  email_quality_alerts BOOLEAN DEFAULT true,
  email_machine_down BOOLEAN DEFAULT true,
  email_shift_reminders BOOLEAN DEFAULT false,
  email_weekly_summary BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  push_urgent_only BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Create work_center_config table for manufacturing settings
CREATE TABLE public.work_center_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_center_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  default_cycle_time INTEGER,
  default_setup_time INTEGER,
  requires_first_article BOOLEAN DEFAULT true,
  requires_qa_signoff BOOLEAN DEFAULT false,
  track_scrap BOOLEAN DEFAULT true,
  track_rework BOOLEAN DEFAULT true,
  custom_fields JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, work_center_type)
);

ALTER TABLE public.work_center_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view work center config"
  ON public.work_center_config FOR SELECT
  USING (
    is_org_member(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Org admins can manage work center config"
  ON public.work_center_config FOR ALL
  USING (
    is_org_admin(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_schedules_updated_at
  BEFORE UPDATE ON public.shift_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_center_config_updated_at
  BEFORE UPDATE ON public.work_center_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();