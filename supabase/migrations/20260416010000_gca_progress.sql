-- GCA Progress Tracking
-- Stores per-user G-Code Academy progress, synced from localStorage via
-- the /api/progress/sync endpoint (wired in GCA_CONFIG.progress.syncEndpoint).
-- RLS ensures users can only read/write their own row.

CREATE TABLE IF NOT EXISTS public.gca_progress (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lesson completion map: { 'l-b-1': { completedAt, attempts } }
  completed_lessons   jsonb NOT NULL DEFAULT '{}',
  -- Test score map: { 'ctrl-fanuc': { score, passedAt, attempts, bestScore } }
  test_scores         jsonb NOT NULL DEFAULT '{}',
  -- Milestone map: { 'op-ready': { earnedAt } }
  milestones          jsonb NOT NULL DEFAULT '{}',

  streak_days         integer NOT NULL DEFAULT 0,
  total_minutes       integer NOT NULL DEFAULT 0,
  last_activity_at    timestamptz,

  -- Tier at time of last sync ('free' | 'pro')
  tier                text NOT NULL DEFAULT 'free',

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT gca_progress_user_unique UNIQUE (user_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_gca_progress_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER gca_progress_updated_at
  BEFORE UPDATE ON public.gca_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_gca_progress_updated_at();

-- RLS
ALTER TABLE public.gca_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own GCA progress"
  ON public.gca_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GCA progress"
  ON public.gca_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GCA progress"
  ON public.gca_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS gca_progress_user_id_idx ON public.gca_progress(user_id);
