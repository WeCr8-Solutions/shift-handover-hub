
-- Shop floor display registrations
CREATE TABLE public.shop_floor_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  display_mode TEXT NOT NULL DEFAULT 'supervisor' CHECK (display_mode IN ('supervisor', 'operator')),
  team_ids UUID[] DEFAULT '{}',
  display_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  refresh_interval_seconds INTEGER NOT NULL DEFAULT 30,
  auto_rotate_enabled BOOLEAN DEFAULT false,
  auto_rotate_interval_seconds INTEGER DEFAULT 30,
  dark_mode TEXT DEFAULT 'auto' CHECK (dark_mode IN ('auto', 'always', 'never')),
  alert_sound_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shop_floor_displays ENABLE ROW LEVEL SECURITY;

-- RLS: Org members can view displays
CREATE POLICY "Org members can view displays"
  ON public.shop_floor_displays FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- RLS: Org admins and supervisors can manage displays
CREATE POLICY "Org admins and supervisors can manage displays"
  ON public.shop_floor_displays FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  );

CREATE POLICY "Org admins and supervisors can update displays"
  ON public.shop_floor_displays FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  );

CREATE POLICY "Org admins can delete displays"
  ON public.shop_floor_displays FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_floor_displays TO authenticated;

-- Token validation function (security definer to bypass RLS for display route)
CREATE OR REPLACE FUNCTION public.validate_display_token(_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _display RECORD;
BEGIN
  SELECT * INTO _display
  FROM public.shop_floor_displays
  WHERE display_token = _token
    AND is_active = true
    AND token_expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Token invalid or expired');
  END IF;

  -- Update last_seen
  UPDATE public.shop_floor_displays SET last_seen_at = now() WHERE id = _display.id;

  RETURN jsonb_build_object(
    'valid', true,
    'display_id', _display.id,
    'organization_id', _display.organization_id,
    'display_name', _display.display_name,
    'display_mode', _display.display_mode,
    'team_ids', _display.team_ids,
    'refresh_interval_seconds', _display.refresh_interval_seconds,
    'auto_rotate_enabled', _display.auto_rotate_enabled,
    'auto_rotate_interval_seconds', _display.auto_rotate_interval_seconds,
    'dark_mode', _display.dark_mode,
    'alert_sound_enabled', _display.alert_sound_enabled
  );
END;
$$;

-- Allow anon to call validate (displays won't be logged-in users)
GRANT EXECUTE ON FUNCTION public.validate_display_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_display_token(TEXT) TO authenticated;

-- Updated_at trigger
CREATE TRIGGER update_shop_floor_displays_updated_at
  BEFORE UPDATE ON public.shop_floor_displays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
