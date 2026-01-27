-- Fix permissive RLS policy by scoping it to service_role only
ALTER POLICY "Service role can manage stripe events"
  ON public.stripe_events
  TO service_role;