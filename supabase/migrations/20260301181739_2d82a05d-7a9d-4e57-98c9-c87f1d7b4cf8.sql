
-- Migration 1: Add ITAR compliance columns to organizations
-- These are nullable with defaults so existing rows are unaffected.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_us_person_declaration boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.mfa_required IS 'When true, all org members must enrol MFA before accessing data.';
COMMENT ON COLUMN public.organizations.requires_us_person_declaration IS 'When true, members must self-certify as US Persons (ITAR compliance).';
