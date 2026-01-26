-- Create activity log types enum
CREATE TYPE public.activity_type AS ENUM (
  'login',
  'logout',
  'signup',
  'handoff_created',
  'handoff_updated',
  'station_created',
  'station_updated',
  'station_deleted',
  'team_created',
  'team_updated',
  'team_deleted',
  'user_role_changed',
  'team_member_added',
  'team_member_removed',
  'profile_updated'
);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  user_display_name TEXT,
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins and supervisors can view all activity logs
CREATE POLICY "Admins and supervisors can view all activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for activity logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;