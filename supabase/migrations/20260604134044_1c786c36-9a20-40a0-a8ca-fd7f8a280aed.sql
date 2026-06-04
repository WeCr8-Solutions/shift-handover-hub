ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS subscribed_station_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subscribe_all_stations boolean NOT NULL DEFAULT true;