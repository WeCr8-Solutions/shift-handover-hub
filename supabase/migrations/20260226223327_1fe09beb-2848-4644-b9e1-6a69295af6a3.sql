
ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS setup_wizard_dismissed boolean NOT NULL DEFAULT false;
