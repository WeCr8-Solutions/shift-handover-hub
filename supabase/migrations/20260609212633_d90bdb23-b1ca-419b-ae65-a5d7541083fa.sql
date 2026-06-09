
-- 1. Customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_org_name_unique UNIQUE (organization_id, name)
);
CREATE INDEX idx_customers_org ON public.customers(organization_id, is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view customers"
  ON public.customers FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create customers"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Org admins can update customers"
  ON public.customers FOR UPDATE TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete customers"
  ON public.customers FOR DELETE TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Platform admins full access to customers"
  ON public.customers FOR ALL TO authenticated
  USING (is_dev_or_admin(auth.uid())) WITH CHECK (is_dev_or_admin(auth.uid()));

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Extend part_catalog with customer + default quantity
ALTER TABLE public.part_catalog
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_quantity integer;
CREATE INDEX IF NOT EXISTS idx_part_catalog_customer ON public.part_catalog(customer_id);

-- 3. Link queue_items to customer
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_queue_items_customer ON public.queue_items(customer_id);

-- 4. Numbering counters table (atomic per-org per-kind sequence)
CREATE TABLE public.org_numbering_counters (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('work_order','quote')),
  next_value bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, kind)
);

GRANT SELECT ON public.org_numbering_counters TO authenticated;
GRANT ALL ON public.org_numbering_counters TO service_role;

ALTER TABLE public.org_numbering_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their numbering counters"
  ON public.org_numbering_counters FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- 5. RPC: generate next number
-- Reads numbering preferences from app_settings.manufacturing_preferences,
-- atomically increments the per-org counter, and formats:  <prefix><separator><zero-padded-number>
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
  INSERT INTO public.org_numbering_counters (organization_id, kind, next_value, updated_at)
  VALUES (_organization_id, _kind, _starting + 1, now())
  ON CONFLICT (organization_id, kind) DO UPDATE
    SET next_value = public.org_numbering_counters.next_value + 1,
        updated_at = now()
  RETURNING next_value - 1 INTO _next;

  IF _format = 'numeric' THEN
    -- Numbers only, zero-padded, no prefix.
    _formatted := lpad(_next::text, GREATEST(_padding, 1), '0');
  ELSE
    -- Alphanumeric: <PREFIX><SEPARATOR><PADDED NUMBER>
    _formatted := COALESCE(_prefix,'') || COALESCE(_separator,'') || lpad(_next::text, GREATEST(_padding, 1), '0');
  END IF;

  RETURN _formatted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_next_wo_number(uuid, text) TO authenticated;
