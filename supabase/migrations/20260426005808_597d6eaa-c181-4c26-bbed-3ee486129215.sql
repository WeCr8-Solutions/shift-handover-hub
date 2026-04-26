
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_jobline_approved_verifier boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_jobline_approved_vendor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_jobline_approved_mentor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verifier_display_name text,
  ADD COLUMN IF NOT EXISTS verifier_tagline text,
  ADD COLUMN IF NOT EXISTS verifier_approved_at timestamptz;
