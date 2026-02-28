
CREATE TABLE public.visitor_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heard_about_us TEXT NOT NULL,
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  other_heard_about TEXT,
  other_looking_for TEXT,
  source_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_surveys ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts only
CREATE POLICY "Allow anonymous inserts"
  ON public.visitor_surveys
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No select/update/delete for anon or authenticated (admin can query via service role)
