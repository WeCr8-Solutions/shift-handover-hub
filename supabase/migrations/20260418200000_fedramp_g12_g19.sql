-- FedRAMP G-12: AI opt-out toggle (AC-20, SA-9)
-- When ai_enabled = false on an organization, the ai-planning-assistant
-- edge function returns 403 for all requests from that org.
-- Default false (opt-in model) for new organizations.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.ai_enabled IS
  'FedRAMP G-12 (AC-20, SA-9): When false, all AI features are disabled for '
  'this organization. Org admins and owners may toggle via Settings. '
  'Default false (opt-in). Required for FedRAMP Moderate compliance.';

-- Allow org admins/owners to update ai_enabled (mirrors mfa_required policy pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'organizations'
      AND policyname = 'Org admins can update ai_enabled'
  ) THEN
    CREATE POLICY "Org admins can update ai_enabled"
      ON public.organizations
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'owner')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'owner')
        )
      );
  END IF;
END $$;

-- FedRAMP G-19: Rules of Behavior acceptance tracking (PL-4)
-- Stores the timestamp and version of RoB accepted by each user at signup.
-- Required for FedRAMP Moderate: users must explicitly accept RoB before access.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rob_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS rob_version text;

COMMENT ON COLUMN public.profiles.rob_accepted_at IS
  'FedRAMP G-19 (PL-4): Timestamp when the user accepted the Rules of Behavior. '
  'NULL means not yet accepted — user will be shown RoB gate on next login.';

COMMENT ON COLUMN public.profiles.rob_version IS
  'Version string of the RoB document accepted (e.g. "1.0-2026-04"). '
  'If the stored version differs from the current published version, '
  'the user will be prompted to re-accept.';
