-- Add foreign key constraint from team_members.user_id to profiles.user_id
-- This enables the Supabase client to perform JOIN queries between team_members and profiles

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- Create departments table for organizing stations
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add department_id column to stations table
ALTER TABLE public.stations 
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Enable RLS on departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
-- Admins and supervisors can view all departments
CREATE POLICY "Admins and supervisors can view all departments"
ON public.departments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

-- Team members can view departments in their team
CREATE POLICY "Team members can view departments"
ON public.departments FOR SELECT TO authenticated
USING (is_team_member(auth.uid(), team_id));

-- Team admins can create departments
CREATE POLICY "Team admins can create departments"
ON public.departments FOR INSERT TO authenticated
WITH CHECK (is_team_admin(auth.uid(), team_id) OR has_role(auth.uid(), 'admin'));

-- Team admins can update departments
CREATE POLICY "Team admins can update departments"
ON public.departments FOR UPDATE TO authenticated
USING (is_team_admin(auth.uid(), team_id) OR has_role(auth.uid(), 'admin'));

-- Team admins can delete departments
CREATE POLICY "Team admins can delete departments"
ON public.departments FOR DELETE TO authenticated
USING (is_team_admin(auth.uid(), team_id) OR has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at on departments
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();