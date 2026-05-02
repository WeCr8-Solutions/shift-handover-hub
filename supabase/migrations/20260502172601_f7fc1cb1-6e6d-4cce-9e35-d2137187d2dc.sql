
-- =====================================================================
-- SECURITY HARDENING: 3 error-level findings
-- 1) Realtime cross-org channel leak
-- 2) Quiz correct_answers exposure (OAP + GCA)
-- 3) operator-profiles bucket public CDN leak
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) REALTIME: drop dangerous broad policies; keep org-scoped + user-scoped
-- ---------------------------------------------------------------------
-- The dangerous one: any authed user can subscribe to anything.
DROP POLICY IF EXISTS "realtime_authenticated_only" ON realtime.messages;
DROP POLICY IF EXISTS "realtime_authenticated_insert" ON realtime.messages;

-- Loose org-membership LIKE matchers — superseded by realtime_topic_org_id() policies.
DROP POLICY IF EXISTS "authenticated_can_receive_org_scoped_broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_can_send_org_scoped_broadcasts" ON realtime.messages;

-- Tighten remaining INSERT policies: must be either org-scoped (member) or user-scoped (self) topic.
-- Replace the catch-all "Org members can send realtime messages for their org" (qual was NULL → allowed all inserts).
DROP POLICY IF EXISTS "Org members can send realtime messages for their org" ON realtime.messages;
DROP POLICY IF EXISTS "jobline_realtime_insert_org_scoped" ON realtime.messages;
DROP POLICY IF EXISTS "rt_user_scoped_broadcast" ON realtime.messages;

CREATE POLICY "rt_insert_org_or_user_scoped"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    public.realtime_topic_org_id(realtime.topic()) IS NOT NULL
    AND public.is_org_member(auth.uid(), public.realtime_topic_org_id(realtime.topic()))
  )
  OR (
    realtime.topic() LIKE 'user:%'
    AND split_part(realtime.topic(), ':', 2) = (auth.uid())::text
  )
  OR (
    -- talent/messaging user-scoped topics
    (realtime.topic() LIKE 'org-conn-%'
      OR realtime.topic() LIKE 'org-msg-%'
      OR realtime.topic() LIKE 'org-msg-unread-%'
      OR realtime.topic() LIKE 'talent-inbox-%')
    AND public.realtime_topic_uuid_suffix(realtime.topic()) = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- 2) QUIZ ANSWERS: revoke column SELECT, expose admin views
-- ---------------------------------------------------------------------
-- Column-level revocation: clients (authenticated/anon) can never select these columns.
REVOKE SELECT (correct_answers, explanation) ON public.oap_quiz_questions FROM authenticated, anon;
REVOKE SELECT (correct_answers, explanation) ON public.gca_questions FROM authenticated, anon;

-- Admin-only views for the AttemptsReviewPanel and editors.
CREATE OR REPLACE VIEW public.oap_quiz_questions_admin
WITH (security_invoker = false) AS
SELECT q.*
FROM public.oap_quiz_questions q
WHERE public.has_role(auth.uid(), 'admin'::app_role);

CREATE OR REPLACE VIEW public.gca_questions_admin
WITH (security_invoker = false) AS
SELECT q.*
FROM public.gca_questions q
WHERE public.has_role(auth.uid(), 'admin'::app_role);

REVOKE ALL ON public.oap_quiz_questions_admin FROM PUBLIC, anon;
REVOKE ALL ON public.gca_questions_admin FROM PUBLIC, anon;
GRANT SELECT ON public.oap_quiz_questions_admin TO authenticated;
GRANT SELECT ON public.gca_questions_admin TO authenticated;

COMMENT ON VIEW public.oap_quiz_questions_admin IS
  'Admin-only view exposing correct_answers + explanation. Filtered by has_role(admin) inside the view body so only admins receive rows.';
COMMENT ON VIEW public.gca_questions_admin IS
  'Admin-only view exposing correct_answers + explanation. Filtered by has_role(admin) inside the view body so only admins receive rows.';

-- ---------------------------------------------------------------------
-- 3) OPERATOR-PROFILES BUCKET: private + visibility-gated RLS
-- ---------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'operator-profiles';

-- Drop the broad "anyone can read public/ folder" policy. We replace it with
-- a join to operator_profiles.profile_visibility = 'public'. Anonymous CDN
-- reads no longer work because the bucket is private; signed URLs created by
-- our own code carry their own auth.
DROP POLICY IF EXISTS "op_files_public_folder_read" ON storage.objects;
DROP POLICY IF EXISTS "op_files_public_read_user_scoped" ON storage.objects;

-- Authenticated users can read another operator's files only if that
-- operator has set profile_visibility = 'public'. Owners still read their
-- own files via op_files_owner_read.
CREATE POLICY "op_files_public_profile_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'operator-profiles'
  AND EXISTS (
    SELECT 1
    FROM public.operator_profiles op
    WHERE op.user_id::text = (storage.foldername(name))[1]
      AND op.profile_visibility = 'public'
  )
);
