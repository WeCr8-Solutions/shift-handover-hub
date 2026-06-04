
-- Define accent stripper FIRST so slugify can reference it
CREATE OR REPLACE FUNCTION public.unaccent_safe(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(input,
    'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÑñÇç',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuNnCc')
$$;

CREATE OR REPLACE FUNCTION public.mfg_100_slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent_safe(input)), '[^a-z0-9]+', '-', 'g'))
$$;

ALTER TABLE public.mfg_100_nominations
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS score_impact smallint,
  ADD COLUMN IF NOT EXISTS score_innovation smallint,
  ADD COLUMN IF NOT EXISTS score_visibility smallint,
  ADD COLUMN IF NOT EXISTS score_education smallint,
  ADD COLUMN IF NOT EXISTS score_smb smallint,
  ADD COLUMN IF NOT EXISTS score_momentum smallint,
  ADD COLUMN IF NOT EXISTS previous_rank integer,
  ADD COLUMN IF NOT EXISTS edition text NOT NULL DEFAULT '2026';

ALTER TABLE public.mfg_100_nominations
  DROP CONSTRAINT IF EXISTS mfg_100_score_bounds_chk;
ALTER TABLE public.mfg_100_nominations
  ADD CONSTRAINT mfg_100_score_bounds_chk CHECK (
    (score_impact     IS NULL OR score_impact     BETWEEN 0 AND 25) AND
    (score_innovation IS NULL OR score_innovation BETWEEN 0 AND 20) AND
    (score_visibility IS NULL OR score_visibility BETWEEN 0 AND 20) AND
    (score_education  IS NULL OR score_education  BETWEEN 0 AND 15) AND
    (score_smb        IS NULL OR score_smb        BETWEEN 0 AND 10) AND
    (score_momentum   IS NULL OR score_momentum   BETWEEN 0 AND 10)
  );

ALTER TABLE public.mfg_100_nominations DROP COLUMN IF EXISTS score_total;
ALTER TABLE public.mfg_100_nominations
  ADD COLUMN score_total smallint GENERATED ALWAYS AS (
    COALESCE(score_impact,0) + COALESCE(score_innovation,0) + COALESCE(score_visibility,0)
    + COALESCE(score_education,0) + COALESCE(score_smb,0) + COALESCE(score_momentum,0)
  ) STORED;

ALTER TABLE public.mfg_100_nominations DROP COLUMN IF EXISTS rank_movement;
ALTER TABLE public.mfg_100_nominations
  ADD COLUMN rank_movement text GENERATED ALWAYS AS (
    CASE
      WHEN rank IS NULL THEN NULL
      WHEN previous_rank IS NULL THEN 'new'
      WHEN previous_rank > rank THEN 'up'
      WHEN previous_rank < rank THEN 'down'
      ELSE 'same'
    END
  ) STORED;

UPDATE public.mfg_100_nominations
SET slug = public.mfg_100_slugify(nominee_name)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS mfg_100_nominations_slug_uidx
  ON public.mfg_100_nominations(slug)
  WHERE slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.mfg_100_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.mfg_100_slugify(NEW.nominee_name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mfg_100_set_slug ON public.mfg_100_nominations;
CREATE TRIGGER trg_mfg_100_set_slug
  BEFORE INSERT OR UPDATE OF nominee_name, slug
  ON public.mfg_100_nominations
  FOR EACH ROW
  EXECUTE FUNCTION public.mfg_100_set_slug();

DROP VIEW IF EXISTS public.mfg_100_honorees;
CREATE VIEW public.mfg_100_honorees
WITH (security_invoker = true) AS
SELECT
  id,
  slug,
  nominee_name,
  nominee_company,
  nominee_role,
  nominee_linkedin,
  nominee_website,
  category,
  COALESCE(display_blurb, '') AS display_blurb,
  reason,
  evidence_links,
  rank,
  previous_rank,
  rank_movement,
  score_total,
  edition,
  published_at
FROM public.mfg_100_nominations
WHERE status = 'published' AND published_at IS NOT NULL;

GRANT SELECT ON public.mfg_100_honorees TO anon, authenticated;
