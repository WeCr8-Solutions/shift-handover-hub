
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS email_morning_brief boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.notification_preferences.email_morning_brief IS
  'Roadmap #16 — supervisor morning brief digest opt-in.';
