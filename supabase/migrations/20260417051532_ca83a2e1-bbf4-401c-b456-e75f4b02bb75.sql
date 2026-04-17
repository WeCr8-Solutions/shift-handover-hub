-- GCA Subscriptions: standalone per-user subscription to G-Code Academy
-- Separate from org-scoped platform subscriptions. Written by stripe-webhook
-- using the service role key. Users can read their own row only.

CREATE TABLE IF NOT EXISTS public.gca_subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id       text,
  stripe_subscription_id   text UNIQUE,
  stripe_price_id          text,
  tier                     text NOT NULL DEFAULT 'gca_pro',
  status                   text NOT NULL DEFAULT 'active',
  current_period_end       timestamptz,
  cancel_at_period_end     boolean NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gca_subscriptions_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS gca_subscriptions_user_id_idx ON public.gca_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS gca_subscriptions_stripe_customer_idx ON public.gca_subscriptions(stripe_customer_id);

CREATE TRIGGER gca_subscriptions_updated_at
  BEFORE UPDATE ON public.gca_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.gca_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own GCA subscription"
  ON public.gca_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for authenticated users —
-- only the service role (used by stripe-webhook) can write.
-- Platform admins can also view all GCA subscriptions for support.
CREATE POLICY "Platform admins can view all GCA subscriptions"
  ON public.gca_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));