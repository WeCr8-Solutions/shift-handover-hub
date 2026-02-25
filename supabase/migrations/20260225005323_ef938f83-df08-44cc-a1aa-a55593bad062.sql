
-- 1A: Add parts_completed and current_phase to queue_items for phase-aware remaining time
ALTER TABLE public.queue_items 
  ADD COLUMN IF NOT EXISTS parts_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_phase text DEFAULT 'setup';

-- Add comment for documentation
COMMENT ON COLUMN public.queue_items.parts_completed IS 'Number of parts completed so far';
COMMENT ON COLUMN public.queue_items.current_phase IS 'Current work phase: setup, first_article, production, complete';

-- 4A: Create atomic reorder function to replace N+1 sequential updates
CREATE OR REPLACE FUNCTION public.reorder_queue_item(
  _item_id uuid,
  _new_position integer,
  _org_id uuid DEFAULT NULL,
  _team_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old_position integer;
BEGIN
  -- Get current position
  SELECT position INTO _old_position
  FROM public.queue_items
  WHERE id = _item_id;

  IF _old_position IS NULL THEN
    RAISE EXCEPTION 'Queue item not found: %', _item_id;
  END IF;

  IF _old_position = _new_position THEN
    RETURN; -- No-op
  END IF;

  IF _new_position < _old_position THEN
    -- Moving up: increment positions of items between new and old
    UPDATE public.queue_items
    SET position = position + 1
    WHERE position >= _new_position
      AND position < _old_position
      AND id != _item_id
      AND (_org_id IS NULL OR organization_id = _org_id)
      AND (_team_id IS NULL OR team_id = _team_id);
  ELSE
    -- Moving down: decrement positions of items between old and new
    UPDATE public.queue_items
    SET position = position - 1
    WHERE position > _old_position
      AND position <= _new_position
      AND id != _item_id
      AND (_org_id IS NULL OR organization_id = _org_id)
      AND (_team_id IS NULL OR team_id = _team_id);
  END IF;

  -- Update the moved item
  UPDATE public.queue_items
  SET position = _new_position
  WHERE id = _item_id;
END;
$$;
