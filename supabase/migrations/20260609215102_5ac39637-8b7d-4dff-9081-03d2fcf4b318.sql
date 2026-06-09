
-- 1. Safety-net trigger: ensure org creator becomes owner
CREATE OR REPLACE FUNCTION public.ensure_org_creator_is_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_org_creator_is_owner ON public.organizations;
CREATE TRIGGER trg_ensure_org_creator_is_owner
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.ensure_org_creator_is_owner();

-- 2. Backfill: any org missing an owner gets created_by as owner
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT o.id, o.created_by, 'owner'
FROM public.organizations o
WHERE o.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = o.id AND om.role = 'owner'
  )
ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';

-- 3. Transfer ownership RPC
CREATE OR REPLACE FUNCTION public.transfer_org_ownership(
  _organization_id uuid,
  _to_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _organization_id
      AND user_id = v_caller
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _organization_id
      AND user_id = _to_user_id
  ) THEN
    RAISE EXCEPTION 'Target user is not a member of this organization';
  END IF;

  IF _to_user_id = v_caller THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself';
  END IF;

  UPDATE public.organization_members
  SET role = 'admin'
  WHERE organization_id = _organization_id AND user_id = v_caller;

  UPDATE public.organization_members
  SET role = 'owner'
  WHERE organization_id = _organization_id AND user_id = _to_user_id;

  INSERT INTO public.organization_audit_events
    (organization_id, actor_user_id, event_type, target_user_id, metadata)
  VALUES
    (_organization_id, v_caller, 'ownership_transferred', _to_user_id,
     jsonb_build_object('from_user_id', v_caller, 'to_user_id', _to_user_id));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_org_ownership(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_org_ownership(uuid, uuid) TO authenticated;

-- 4. Claim ownership RPC (creator with no owner present)
CREATE OR REPLACE FUNCTION public.claim_org_ownership(
  _organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_creator uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT created_by INTO v_creator
  FROM public.organizations
  WHERE id = _organization_id;

  IF v_creator IS NULL OR v_creator <> v_caller THEN
    RAISE EXCEPTION 'Only the original creator can claim ownership';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _organization_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'This organization already has an owner';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_organization_id, v_caller, 'owner')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';

  INSERT INTO public.organization_audit_events
    (organization_id, actor_user_id, event_type, target_user_id, metadata)
  VALUES
    (_organization_id, v_caller, 'ownership_claimed', v_caller,
     jsonb_build_object('claimed_by_creator', true));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_org_ownership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_org_ownership(uuid) TO authenticated;
