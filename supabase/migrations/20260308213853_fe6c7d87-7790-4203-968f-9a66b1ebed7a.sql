
-- Step 1: Add enum values only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'engineering';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'programming';
