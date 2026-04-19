ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rob_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS rob_version text;