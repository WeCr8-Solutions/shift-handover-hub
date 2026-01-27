-- Add 'developer' role to the app_role enum for SDK team access
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- Note: RLS policies for user_roles already allow admins to manage roles
-- The 'developer' role will be used exclusively for SDK team access to testing