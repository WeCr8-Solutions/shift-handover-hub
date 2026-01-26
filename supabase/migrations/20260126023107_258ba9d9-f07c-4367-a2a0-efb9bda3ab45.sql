-- Create enum for queue item types
CREATE TYPE public.queue_item_type AS ENUM ('work_order', 'station_task', 'team_task', 'support_ticket');

-- Create enum for queue item status
CREATE TYPE public.queue_status AS ENUM ('pending', 'queued', 'in_progress', 'on_hold', 'completed', 'cancelled');

-- Create enum for priority levels
CREATE TYPE public.queue_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'critical');

-- Create queue_items table
CREATE TABLE public.queue_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  
  -- Item details
  item_type queue_item_type NOT NULL DEFAULT 'team_task',
  title TEXT NOT NULL,
  description TEXT,
  
  -- Work order details (for work_order type)
  work_order TEXT,
  part_number TEXT,
  operation_number TEXT,
  quantity INTEGER,
  
  -- Status and priority
  status queue_status NOT NULL DEFAULT 'pending',
  priority queue_priority NOT NULL DEFAULT 'normal',
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Assignments
  assigned_to UUID,
  assigned_by UUID,
  
  -- Scheduling
  due_date TIMESTAMP WITH TIME ZONE,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- in minutes
  
  -- Progress tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_item_comments table for discussion
CREATE TABLE public.queue_item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_item_id UUID REFERENCES public.queue_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_item_history table for tracking changes
CREATE TABLE public.queue_item_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_item_id UUID REFERENCES public.queue_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_item_history ENABLE ROW LEVEL SECURITY;

-- Queue items policies
CREATE POLICY "Team members can view queue items"
  ON public.queue_items FOR SELECT
  USING (team_id IS NULL OR is_team_member(auth.uid(), team_id) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Team members can create queue items"
  ON public.queue_items FOR INSERT
  WITH CHECK (team_id IS NULL OR is_team_member(auth.uid(), team_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can update queue items"
  ON public.queue_items FOR UPDATE
  USING (team_id IS NULL OR is_team_member(auth.uid(), team_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Team admins can delete queue items"
  ON public.queue_items FOR DELETE
  USING (is_team_admin(auth.uid(), team_id) OR has_role(auth.uid(), 'admin'));

-- Queue comments policies
CREATE POLICY "Team members can view comments"
  ON public.queue_item_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.queue_items qi 
    WHERE qi.id = queue_item_id 
    AND (qi.team_id IS NULL OR is_team_member(auth.uid(), qi.team_id) OR has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Team members can add comments"
  ON public.queue_item_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Queue history policies
CREATE POLICY "Team members can view history"
  ON public.queue_item_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.queue_items qi 
    WHERE qi.id = queue_item_id 
    AND (qi.team_id IS NULL OR is_team_member(auth.uid(), qi.team_id) OR has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "System can insert history"
  ON public.queue_item_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_queue_items_team ON public.queue_items(team_id);
CREATE INDEX idx_queue_items_station ON public.queue_items(station_id);
CREATE INDEX idx_queue_items_status ON public.queue_items(status);
CREATE INDEX idx_queue_items_priority ON public.queue_items(priority);
CREATE INDEX idx_queue_items_position ON public.queue_items(position);
CREATE INDEX idx_queue_items_due_date ON public.queue_items(due_date);
CREATE INDEX idx_queue_items_assigned ON public.queue_items(assigned_to);

-- Add trigger for updated_at
CREATE TRIGGER update_queue_items_updated_at
  BEFORE UPDATE ON public.queue_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for queue_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_items;