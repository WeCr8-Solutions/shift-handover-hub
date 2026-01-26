-- Create job performance updates table
CREATE TABLE public.job_performance_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Job context
  work_order TEXT,
  part_number TEXT,
  operation_number TEXT,
  
  -- Update type and category
  update_type TEXT NOT NULL CHECK (update_type IN ('setup_change', 'adjustment', 'improvement', 'issue', 'other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  -- Quick checkboxes
  affects_cycle_time BOOLEAN DEFAULT false,
  affects_quality BOOLEAN DEFAULT false,
  affects_safety BOOLEAN DEFAULT false,
  requires_tooling_change BOOLEAN DEFAULT false,
  requires_program_update BOOLEAN DEFAULT false,
  requires_fixture_modification BOOLEAN DEFAULT false,
  requires_engineering_review BOOLEAN DEFAULT false,
  requires_qa_approval BOOLEAN DEFAULT false,
  
  -- Text inputs
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_solution TEXT,
  expected_benefit TEXT,
  
  -- Image attachments (array of storage URLs)
  image_urls TEXT[] DEFAULT '{}',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'implemented', 'rejected')),
  reviewer_id UUID,
  reviewer_name TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_job_performance_updates_team ON public.job_performance_updates(team_id);
CREATE INDEX idx_job_performance_updates_station ON public.job_performance_updates(station_id);
CREATE INDEX idx_job_performance_updates_user ON public.job_performance_updates(user_id);
CREATE INDEX idx_job_performance_updates_status ON public.job_performance_updates(status);
CREATE INDEX idx_job_performance_updates_created ON public.job_performance_updates(created_at DESC);

-- Enable RLS
ALTER TABLE public.job_performance_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own updates"
  ON public.job_performance_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view updates in their teams"
  ON public.job_performance_updates FOR SELECT
  TO authenticated
  USING (
    (team_id IS NULL) OR 
    public.is_team_member(auth.uid(), team_id) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admins and supervisors can view all updates"
  ON public.job_performance_updates FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Users can update their own pending updates"
  ON public.job_performance_updates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins and supervisors can update any updates"
  ON public.job_performance_updates FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Create storage bucket for performance update images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('performance-updates', 'performance-updates', true, 10485760);

-- Storage policies
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'performance-updates');

CREATE POLICY "Anyone can view performance update images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'performance-updates');

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'performance-updates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add trigger for updated_at
CREATE TRIGGER update_job_performance_updates_updated_at
  BEFORE UPDATE ON public.job_performance_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_performance_updates;