-- Add has_seen_welcome column to track if user has seen the welcome modal
ALTER TABLE public.user_onboarding 
ADD COLUMN IF NOT EXISTS has_seen_welcome boolean DEFAULT false;