
-- 1. Revoke direct column access to billing identifiers on organizations
REVOKE SELECT (stripe_customer_id, billing_email) ON public.organizations FROM authenticated, anon;

-- Helper: admin-only billing identifiers view
CREATE OR REPLACE VIEW public.organization_billing_identifiers
WITH (security_invoker = true)
AS
SELECT id AS organization_id, stripe_customer_id, billing_email
FROM public.organizations o
WHERE public.is_org_admin(auth.uid(), o.id)
   OR public.has_role(auth.uid(), 'admin'::public.app_role);

GRANT SELECT ON public.organization_billing_identifiers TO authenticated;

-- 2. Realtime topic-based RLS
-- Allow authenticated users to receive broadcast/presence messages only on topics
-- matching their organizations: "org:{org_id}:..." or system-wide "platform:..."
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'realtime' AND c.relname = 'messages') THEN

    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    -- Drop any prior policies we may have created so this stays idempotent
    EXECUTE 'DROP POLICY IF EXISTS "auth users read own org topics" ON realtime.messages';
    EXECUTE 'DROP POLICY IF EXISTS "auth users write own org topics" ON realtime.messages';

    EXECUTE $POL$
      CREATE POLICY "auth users read own org topics"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (
        -- Topic must encode an org id the caller belongs to
        (
          realtime.topic() LIKE 'org:%'
          AND public.is_org_member(
            auth.uid(),
            NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
          )
        )
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
    $POL$;

    EXECUTE $POL$
      CREATE POLICY "auth users write own org topics"
      ON realtime.messages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        (
          realtime.topic() LIKE 'org:%'
          AND public.is_org_member(
            auth.uid(),
            NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
          )
        )
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
    $POL$;
  END IF;
END$$;
