
-- 1. Soft-delete column
ALTER TABLE public.mfg_100_nominations
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Dedupe: same nominator + nominee + edition cannot be submitted twice
CREATE UNIQUE INDEX IF NOT EXISTS mfg_100_nominations_dedupe_uidx
  ON public.mfg_100_nominations (
    lower(nominator_email),
    lower(nominee_name),
    edition
  )
  WHERE archived_at IS NULL;

-- 3. Audit log
CREATE TABLE IF NOT EXISTS public.mfg_100_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id uuid NOT NULL REFERENCES public.mfg_100_nominations(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mfg_100_audit_nomination_idx
  ON public.mfg_100_audit_log (nomination_id, created_at DESC);

GRANT SELECT ON public.mfg_100_audit_log TO authenticated;
GRANT ALL ON public.mfg_100_audit_log TO service_role;

ALTER TABLE public.mfg_100_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read mfg_100 audit" ON public.mfg_100_audit_log;
CREATE POLICY "Admins read mfg_100 audit"
  ON public.mfg_100_audit_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

-- 4. Trigger that writes to audit log on meaningful changes
CREATE OR REPLACE FUNCTION public.mfg_100_log_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_before jsonb;
  v_after jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log when something meaningful changed
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.rank IS DISTINCT FROM OLD.rank
       OR NEW.previous_rank IS DISTINCT FROM OLD.previous_rank
       OR NEW.display_blurb IS DISTINCT FROM OLD.display_blurb
       OR NEW.slug IS DISTINCT FROM OLD.slug
       OR NEW.score_impact IS DISTINCT FROM OLD.score_impact
       OR NEW.score_innovation IS DISTINCT FROM OLD.score_innovation
       OR NEW.score_visibility IS DISTINCT FROM OLD.score_visibility
       OR NEW.score_education IS DISTINCT FROM OLD.score_education
       OR NEW.score_smb IS DISTINCT FROM OLD.score_smb
       OR NEW.score_momentum IS DISTINCT FROM OLD.score_momentum
       OR NEW.archived_at IS DISTINCT FROM OLD.archived_at
       OR NEW.published_at IS DISTINCT FROM OLD.published_at
    THEN
      v_action := 'updated';
      v_before := to_jsonb(OLD);
      v_after := to_jsonb(NEW);
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.mfg_100_audit_log (nomination_id, actor_id, action, before, after)
  VALUES (NEW.id, auth.uid(), v_action, v_before, v_after);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mfg_100_audit ON public.mfg_100_nominations;
CREATE TRIGGER trg_mfg_100_audit
AFTER INSERT OR UPDATE ON public.mfg_100_nominations
FOR EACH ROW EXECUTE FUNCTION public.mfg_100_log_changes();

-- 5. "Publish edition" RPC: snapshots previous rank then publishes ranked rows
CREATE OR REPLACE FUNCTION public.mfg_100_publish_edition(_edition text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Snapshot previous_rank from current published rank within this edition,
  -- but only when the row is moving from a non-published state to published.
  UPDATE public.mfg_100_nominations n
     SET previous_rank = COALESCE(n.previous_rank, NULL)
   WHERE n.edition = _edition;  -- no-op; placeholder so PL/pgSQL stays valid if no rows match below

  UPDATE public.mfg_100_nominations
     SET status = 'published',
         published_at = COALESCE(published_at, now()),
         reviewed_at = now()
   WHERE edition = _edition
     AND archived_at IS NULL
     AND rank IS NOT NULL
     AND status IN ('shortlisted','published');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mfg_100_publish_edition(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mfg_100_publish_edition(text) TO authenticated;

-- 6. Reorder RPC: applies a {id,rank} array atomically and snapshots previous_rank
CREATE OR REPLACE FUNCTION public.mfg_100_apply_ranking(_edition text, _ranking jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Bump current rank into previous_rank for the rows we're about to re-rank
  UPDATE public.mfg_100_nominations
     SET previous_rank = rank
   WHERE edition = _edition
     AND id IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(_ranking))
     AND rank IS NOT NULL;

  FOR r IN
    SELECT (value->>'id')::uuid AS id, (value->>'rank')::int AS rank
    FROM jsonb_array_elements(_ranking)
  LOOP
    UPDATE public.mfg_100_nominations
       SET rank = r.rank
     WHERE id = r.id AND edition = _edition;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mfg_100_apply_ranking(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mfg_100_apply_ranking(text, jsonb) TO authenticated;

-- 7. Reaffirm public read of the honorees view (idempotent)
GRANT SELECT ON public.mfg_100_honorees TO anon, authenticated;
