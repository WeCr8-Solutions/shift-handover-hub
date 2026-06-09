
CREATE OR REPLACE FUNCTION public.generate_next_wo_number(
  _organization_id uuid,
  _kind text DEFAULT 'work_order'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefs jsonb;
  _prefix text;
  _separator text;
  _padding int;
  _starting bigint;
  _next bigint;
  _format text;
  _formatted text;
BEGIN
  IF NOT is_org_member(auth.uid(), _organization_id) THEN
    RAISE EXCEPTION 'Not a member of organization';
  END IF;

  IF _kind NOT IN ('work_order','quote') THEN
    RAISE EXCEPTION 'Invalid kind: %', _kind;
  END IF;

  SELECT setting_value INTO _prefs
  FROM public.app_settings
  WHERE organization_id = _organization_id
    AND team_id IS NULL
    AND setting_key = 'manufacturing_preferences'
  LIMIT 1;

  IF _kind = 'quote' THEN
    _prefix    := COALESCE(_prefs->>'quoteNumberPrefix', 'Q');
    _separator := COALESCE(_prefs->>'quoteNumberSeparator', '-');
    _padding   := COALESCE((_prefs->>'quoteNumberPadding')::int, 4);
    _starting  := COALESCE((_prefs->>'quoteStartingNumber')::bigint, 1001);
    _format    := COALESCE(_prefs->>'quoteNumberFormat', 'alphanumeric');
  ELSE
    _prefix    := COALESCE(_prefs->>'workOrderPrefix', 'WO');
    _separator := COALESCE(_prefs->>'workOrderSeparator', '-');
    _padding   := COALESCE((_prefs->>'workOrderPadding')::int, 4);
    _starting  := COALESCE((_prefs->>'workOrderStartingNumber')::bigint, 1001);
    _format    := COALESCE(_prefs->>'workOrderNumberFormat', 'alphanumeric');
  END IF;

  -- Atomic upsert + increment; seed with starting value the first time.
  -- If an existing counter is below the configured starting value (e.g. settings
  -- were changed after first issuance), jump up to the starting value.
  INSERT INTO public.org_numbering_counters (organization_id, kind, next_value, updated_at)
  VALUES (_organization_id, _kind, _starting + 1, now())
  ON CONFLICT (organization_id, kind) DO UPDATE
    SET next_value = GREATEST(public.org_numbering_counters.next_value, _starting) + 1,
        updated_at = now()
  RETURNING next_value - 1 INTO _next;

  IF _format = 'numeric' THEN
    _formatted := lpad(_next::text, GREATEST(_padding, 1), '0');
  ELSE
    _formatted := COALESCE(_prefix,'') || COALESCE(_separator,'') || lpad(_next::text, GREATEST(_padding, 1), '0');
  END IF;

  RETURN _formatted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_next_wo_number(uuid, text) TO authenticated;
