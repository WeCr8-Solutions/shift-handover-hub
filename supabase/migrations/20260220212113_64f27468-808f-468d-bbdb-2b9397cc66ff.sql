
-- Create email_leads table for lead generation
CREATE TABLE public.email_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source_page TEXT,
  lead_type TEXT DEFAULT 'template_download',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon or authenticated) to insert leads
CREATE POLICY "Anyone can submit email leads"
  ON public.email_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only platform admins can view leads
CREATE POLICY "Admins can view email leads"
  ON public.email_leads
  FOR SELECT
  USING (public.is_dev_or_admin(auth.uid()));
