-- Fix: New users should only get 'operator' role
-- The global 'admin' role is reserved for PLATFORM super-admins only
-- Customer organization admins use organization_members.role = 'owner'/'admin'

-- 1. Update the handle_new_user function to only assign 'operator' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Create operator role (base access for all users)
  -- NOTE: Global 'admin' role is reserved for platform super-admins only
  -- Organization admins get their permissions via organization_members table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operator');

  -- Initialize onboarding
  INSERT INTO public.user_onboarding (user_id, current_step, completed_steps, is_complete)
  VALUES (NEW.id, 'welcome', '{}', false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Clean up: Remove global 'admin' role from users who are NOT platform admins
-- Keep admin role ONLY for users who created the platform (first users) or are explicitly designated
-- For safety, we'll remove admin from users who:
--   - Have 'admin' role but don't have 'owner' or 'admin' in any organization_members
--   - AND are not the very first user (to preserve original platform owner)

DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id NOT IN (
    -- Keep admin for users who are org owners/admins (they may need it temporarily)
    SELECT DISTINCT user_id 
    FROM public.organization_members 
    WHERE role IN ('owner', 'admin')
  )
  -- Also keep the earliest admin (likely the platform creator)
  AND user_id != (
    SELECT user_id 
    FROM public.user_roles 
    WHERE role = 'admin' 
    ORDER BY created_at ASC 
    LIMIT 1
  );