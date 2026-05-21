
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.learning_idea_status AS ENUM ('pending','reviewed','approved','rejected','spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.learning_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id text NOT NULL,
  term_name text NOT NULL,
  role text,
  title text NOT NULL,
  problem text NOT NULL,
  solution text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id uuid,
  submitter_name text,
  submitter_email text,
  source_path text,
  honeypot text,
  spam_score int NOT NULL DEFAULT 0,
  status public.learning_idea_status NOT NULL DEFAULT 'pending',
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_ideas_status ON public.learning_ideas(status);
CREATE INDEX IF NOT EXISTS idx_learning_ideas_user ON public.learning_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_ideas_org ON public.learning_ideas(org_id);
CREATE INDEX IF NOT EXISTS idx_learning_ideas_created ON public.learning_ideas(created_at DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_learning_ideas_updated ON public.learning_ideas;
CREATE TRIGGER trg_learning_ideas_updated
  BEFORE UPDATE ON public.learning_ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.learning_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and devs can view all learning ideas" ON public.learning_ideas;
CREATE POLICY "Admins and devs can view all learning ideas"
  ON public.learning_ideas FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer'));

DROP POLICY IF EXISTS "Submitters can view their own learning ideas" ON public.learning_ideas;
CREATE POLICY "Submitters can view their own learning ideas"
  ON public.learning_ideas FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and devs can update learning ideas" ON public.learning_ideas;
CREATE POLICY "Admins and devs can update learning ideas"
  ON public.learning_ideas FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer'));

-- No INSERT/DELETE policies; submissions flow through SECURITY DEFINER RPC

-- Submission RPC
CREATE OR REPLACE FUNCTION public.submit_learning_idea(
  _term_id text,
  _term_name text,
  _role text,
  _title text,
  _problem text,
  _solution text,
  _source_path text,
  _honeypot text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_org uuid;
  v_name text;
  v_email text;
  v_spam int := 0;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF coalesce(length(trim(_title)),0) = 0 OR coalesce(length(trim(_problem)),0) = 0
     OR coalesce(length(trim(_term_id)),0) = 0 OR coalesce(length(trim(_term_name)),0) = 0 THEN
    RAISE EXCEPTION 'Missing required fields';
  END IF;

  IF _honeypot IS NOT NULL AND length(trim(_honeypot)) > 0 THEN
    v_spam := v_spam + 10;
  END IF;
  IF length(_title) > 200 THEN v_spam := v_spam + 1; END IF;
  IF length(_problem) > 2000 THEN v_spam := v_spam + 1; END IF;

  SELECT display_name, email INTO v_name, v_email
    FROM public.profiles WHERE user_id = v_user;

  SELECT organization_id INTO v_org
    FROM public.organization_members
    WHERE user_id = v_user
    ORDER BY created_at ASC NULLS LAST
    LIMIT 1;

  INSERT INTO public.learning_ideas (
    term_id, term_name, role, title, problem, solution,
    user_id, org_id, submitter_name, submitter_email,
    source_path, honeypot, spam_score,
    status
  ) VALUES (
    trim(_term_id), trim(_term_name), nullif(trim(_role),''),
    trim(_title), trim(_problem), nullif(trim(_solution),''),
    v_user, v_org, v_name, v_email,
    nullif(trim(_source_path),''), _honeypot, v_spam,
    CASE WHEN v_spam >= 10 THEN 'spam'::public.learning_idea_status
         ELSE 'pending'::public.learning_idea_status END
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_learning_idea(text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_learning_idea(text,text,text,text,text,text,text,text) TO authenticated;
