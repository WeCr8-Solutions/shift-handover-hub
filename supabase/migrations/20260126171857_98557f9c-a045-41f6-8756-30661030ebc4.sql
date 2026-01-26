-- Part 1: Add SELECT policy so team creators can view their teams (needed for RETURNING clause)
CREATE POLICY "Users can view teams they created" 
ON public.teams 
FOR SELECT 
TO authenticated
USING (auth.uid() = created_by);

-- Part 2: Update handle_new_user to also assign admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Create operator role (base access)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operator');

  -- Also give admin role for first-time setup (can create teams, manage shop)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$function$;

-- Part 3: Grant admin role to existing user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('47d2772a-6c62-48d6-bb3b-a23055543a76', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;