
-- ============================================================
-- Tighten update permission: supervisors and admins only
-- (Operators can still SELECT via is_org_member policy.)
-- ============================================================

DROP POLICY IF EXISTS "Org members can update packages" ON public.work_order_packages;

CREATE POLICY "Supervisors can update packages"
  ON public.work_order_packages FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND public.can_supervisor_override_in_org(auth.uid(), organization_id)
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND public.can_supervisor_override_in_org(auth.uid(), organization_id)
  );

-- ============================================================
-- Atomic: build a package with N child work orders in one txn
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_package_with_items(
  _organization_id uuid,
  _package jsonb,
  _items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pkg_id uuid;
  _pkg_num text;
  _item jsonb;
  _wo_num text;
  _seq int := 1;
  _new_item_id uuid;
  _due timestamptz;
  _ship date;
BEGIN
  IF NOT public.is_org_member(auth.uid(), _organization_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  _pkg_num := public.generate_next_package_number(_organization_id);
  _ship := NULLIF(_package->>'required_ship_date','')::date;
  _due := CASE WHEN _ship IS NOT NULL THEN _ship::timestamptz ELSE NULL END;

  INSERT INTO public.work_order_packages (
    organization_id, customer_id, package_number, title, description, notes,
    required_ship_date, promised_ship_date, priority, is_quote, created_by
  ) VALUES (
    _organization_id,
    NULLIF(_package->>'customer_id','')::uuid,
    _pkg_num,
    COALESCE(_package->>'title','Package'),
    _package->>'description',
    _package->>'notes',
    _ship,
    NULLIF(_package->>'promised_ship_date','')::date,
    COALESCE(_package->>'priority','normal'),
    COALESCE((_package->>'is_quote')::boolean, false),
    auth.uid()
  ) RETURNING id INTO _pkg_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _wo_num := public.generate_next_wo_number(
      _organization_id,
      CASE WHEN COALESCE((_package->>'is_quote')::boolean, false) THEN 'quote' ELSE 'work_order' END
    );

    INSERT INTO public.queue_items (
      organization_id, created_by,
      item_type, status, position,
      title, work_order, part_number, quantity,
      description, priority, due_date,
      customer_id, package_id, package_sequence
    ) VALUES (
      _organization_id, auth.uid(),
      CASE WHEN COALESCE((_package->>'is_quote')::boolean, false) THEN 'quote' ELSE 'work_order' END,
      CASE WHEN COALESCE((_package->>'is_quote')::boolean, false) THEN 'pending' ELSE 'pending' END,
      0,
      COALESCE(_item->>'title', _item->>'part_number', 'Item ' || _seq),
      _wo_num,
      _item->>'part_number',
      NULLIF(_item->>'quantity','')::int,
      _item->>'description',
      COALESCE(_item->>'priority', COALESCE(_package->>'priority','normal')),
      _due,
      NULLIF(_package->>'customer_id','')::uuid,
      _pkg_id,
      _seq
    ) RETURNING id INTO _new_item_id;

    _seq := _seq + 1;
  END LOOP;

  RETURN _pkg_id;
END;
$$;

-- ============================================================
-- Atomic: approve a quote-package — flip is_quote=false and
-- (re)create matching work orders out of every child quote.
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_quote_package(_package_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
  _is_quote boolean;
  _q record;
  _wo_num text;
  _new_id uuid;
  _count int := 0;
BEGIN
  SELECT organization_id, is_quote INTO _org, _is_quote
  FROM public.work_order_packages WHERE id = _package_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'package not found'; END IF;
  IF NOT public.can_supervisor_override_in_org(auth.uid(), _org) THEN
    RAISE EXCEPTION 'supervisor or admin required';
  END IF;
  IF NOT _is_quote THEN RAISE EXCEPTION 'package is not a quote package'; END IF;

  FOR _q IN
    SELECT * FROM public.queue_items
    WHERE package_id = _package_id
      AND item_type = 'quote'
      AND status <> 'completed'
  LOOP
    _wo_num := public.generate_next_wo_number(_org, 'work_order');

    INSERT INTO public.queue_items (
      organization_id, created_by, item_type, status, position,
      title, work_order, part_number, quantity, description, priority,
      due_date, customer_id, package_id, package_sequence, source_quote_id,
      material_type, part_length_inches, part_width_inches, part_height_inches,
      part_weight_lbs, part_shape, required_tolerance, surface_finish
    ) VALUES (
      _org, auth.uid(), 'work_order', 'pending', 0,
      _q.title, _wo_num, _q.part_number, _q.quantity, _q.description, _q.priority,
      _q.due_date, _q.customer_id, _package_id, _q.package_sequence, _q.id,
      _q.material_type, _q.part_length_inches, _q.part_width_inches, _q.part_height_inches,
      _q.part_weight_lbs, _q.part_shape, _q.required_tolerance, _q.surface_finish
    ) RETURNING id INTO _new_id;

    -- Copy routing
    INSERT INTO public.work_order_routing (
      organization_id, queue_item_id, step_number, operation_name,
      station_id, work_center_type, status, estimated_duration_minutes,
      notes, requires_inspection
    )
    SELECT
      organization_id, _new_id, step_number, operation_name,
      station_id, work_center_type, 'pending', estimated_duration_minutes,
      notes, requires_inspection
    FROM public.work_order_routing
    WHERE queue_item_id = _q.id;

    -- Mark quote as converted
    UPDATE public.queue_items
       SET status = 'completed',
           completed_at = now(),
           converted_to_work_order_id = _new_id,
           converted_at = now(),
           converted_by = auth.uid()
     WHERE id = _q.id;

    _count := _count + 1;
  END LOOP;

  UPDATE public.work_order_packages
     SET is_quote = false, status = 'in_progress', updated_at = now()
   WHERE id = _package_id;

  RETURN _count;
END;
$$;
