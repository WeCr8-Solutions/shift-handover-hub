
-- 1) Lock down stripe_customer_id + billing_email on organizations to service_role only.
REVOKE SELECT (stripe_customer_id, billing_email) ON public.organizations FROM anon, authenticated;
REVOKE UPDATE (stripe_customer_id, billing_email) ON public.organizations FROM anon, authenticated;
REVOKE INSERT (stripe_customer_id, billing_email) ON public.organizations FROM anon, authenticated;

-- 2) Tighten operator_references employer access: require operator profile to be public + published.
DROP POLICY IF EXISTS op_ref_employer_select ON public.operator_references;
CREATE POLICY op_ref_employer_select ON public.operator_references
FOR SELECT TO authenticated
USING (
  is_verified_employer(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles op
    WHERE op.user_id = operator_references.user_id
      AND op.is_discoverable = true
      AND op.profile_visibility = 'public'::operator_profile_visibility
      AND op.public_published_at IS NOT NULL
  )
);

-- 3) Make gca_subscriptions policy intent explicit: restrict to authenticated role.
DROP POLICY IF EXISTS "Users can view own GCA subscription" ON public.gca_subscriptions;
CREATE POLICY "Users can view own GCA subscription" ON public.gca_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Platform admins can view all GCA subscriptions" ON public.gca_subscriptions;
CREATE POLICY "Platform admins can view all GCA subscriptions" ON public.gca_subscriptions
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) Realtime: restrict org:{uuid}:* topic subscriptions to org members.
-- Postgres-changes channels don't go through realtime.messages, so this only
-- affects broadcast/presence on org-prefixed topics — exactly the abuse path.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS org_topic_members_only ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY org_topic_members_only ON realtime.messages
      AS RESTRICTIVE
      FOR SELECT TO authenticated
      USING (
        CASE
          WHEN realtime.topic() LIKE 'org:%'
          THEN EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
              AND om.organization_id::text = split_part(realtime.topic(), ':', 2)
          )
          ELSE true
        END
      )
    $p$;
  END IF;
END$$;
