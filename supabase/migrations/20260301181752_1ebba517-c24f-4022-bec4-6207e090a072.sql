
-- Migration 2: Add US Person declaration fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS us_person_declared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS us_person_declared_at timestamptz,
  ADD COLUMN IF NOT EXISTS us_person_declaration_text text;

COMMENT ON COLUMN public.profiles.us_person_declared IS 'True after user self-certifies as a US Person under ITAR.';
COMMENT ON COLUMN public.profiles.us_person_declared_at IS 'Timestamp of the declaration for audit trail.';
COMMENT ON COLUMN public.profiles.us_person_declaration_text IS 'Exact legal text the user certified against.';
