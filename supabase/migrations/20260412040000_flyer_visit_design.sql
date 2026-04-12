-- Add flyer_design column to flyer_stop_visits
-- Tracks which flyer content/design was left (separate from format/size)
ALTER TABLE public.flyer_stop_visits
  ADD COLUMN IF NOT EXISTS flyer_design text;
