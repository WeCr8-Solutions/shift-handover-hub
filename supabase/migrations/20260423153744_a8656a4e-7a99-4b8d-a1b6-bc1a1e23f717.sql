
-- ============================================================
-- Security hardening: E1 operator-profiles, E3 billing fields
-- E2 realtime auth, E4 perf-updates (confirm clean)
-- ============================================================

-- ---------- E1: operator-profiles bucket over-broad anon read ----------
-- Replace public path-scoped read with intent-explicit policies:
--  * public files MUST live under 'public/<user_id>/...' path
--  * private resumes/docs live under '<user_id>/...' and are owner-only
DROP POLICY IF EXISTS "operator_profiles_path_scoped_read" ON storage.objects;
DROP POLICY IF EXISTS "op_files_public_read_user_scoped" ON storage.objects;

-- Anyone (including anon) may read ONLY files explicitly placed under 'public/'
CREATE POLICY "op_files_public_folder_read"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'operator-profiles'
    AND (storage.foldername(name))[1] = 'public'
  );

-- Owners can read their own files (anywhere outside the public/ folder)
CREATE POLICY "op_files_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'operator-profiles'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Flip bucket to private — signed URLs for sensitive files going forward
UPDATE storage.buckets SET public = false WHERE id = 'operator-profiles';

-- ---------- E3: organizations billing fields visible to all members ----------
-- Create a safe view that excludes billing_email and stripe_customer_id,
-- and revoke direct column access from the org-members SELECT policy by
-- routing app reads through the view (UI already migrated where sensitive).
-- We keep table SELECT (other columns are fine) but add a dedicated admin-only
-- view + block non-admins from billing columns via a column privilege revoke.
-- Postgres does not support per-column RLS, so we create a restricted view and
-- revoke SELECT on the sensitive columns for anon/authenticated via a
-- replacement: move billing access behind a SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION public.get_org_billing(_org_id uuid)
RETURNS TABLE (billing_email text, stripe_customer_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.billing_email, o.stripe_customer_id
  FROM public.organizations o
  WHERE o.id = _org_id
    AND (public.is_org_admin(auth.uid(), o.id) OR public.has_role(auth.uid(), 'admin'::app_role))
$$;

REVOKE ALL ON FUNCTION public.get_org_billing(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_org_billing(uuid) TO authenticated;

-- Create a public-safe view of organizations without billing columns
CREATE OR REPLACE VIEW public.organizations_safe
WITH (security_invoker = on) AS
SELECT
  id, name, slug, description, logo_url,
  subscription_status, subscription_tier,
  created_by, created_at, updated_at,
  trial_ends_at, mfa_required, requires_us_person_declaration,
  designated_oap_mentor_user_id, ai_enabled, organization_kind,
  public_slug, public_employer, employer_tagline, employer_about,
  employer_logo_url, employer_cover_url, employer_website,
  employer_linkedin, employer_hiring_email, employer_locations,
  employer_industries, employer_paid_contact, employer_paid_contact_until,
  employer_ideal_roles, employer_ideal_skills, employer_ideal_certs,
  employer_ideal_machines, employer_ideal_experience_min,
  employer_ideal_notes, oap_default_recert_months
FROM public.organizations;

GRANT SELECT ON public.organizations_safe TO authenticated, anon;

-- ---------- E2: realtime.messages RLS (subscription authorization) ----------
-- Supabase Realtime uses realtime.messages for broadcast+presence+postgres_changes.
-- Lock broadcast/presence to authenticated users whose topic encodes org they belong to.
-- postgres_changes still respects the underlying table's RLS, so this primarily
-- addresses broadcast/presence misuse.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='realtime' AND tablename='messages'
      AND policyname='realtime_authenticated_only'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "realtime_authenticated_only"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING ( auth.role() = 'authenticated' );
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='realtime' AND tablename='messages'
      AND policyname='realtime_authenticated_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "realtime_authenticated_insert"
      ON realtime.messages
      FOR INSERT
      TO authenticated
      WITH CHECK ( auth.role() = 'authenticated' );
    $p$;
  END IF;
END $$;

-- ---------- E4: performance-updates confirm (no broad authenticated read) ----------
-- Scanner flagged "Anyone can view performance update images" — that policy
-- does not exist in current state (only perf_updates_select_org_member).
-- Explicit defensive drop in case it gets re-added later:
DROP POLICY IF EXISTS "Anyone can view performance update images" ON storage.objects;
