-- 1. Organization employer branding
DO $$ BEGIN
  CREATE TYPE public.organization_kind AS ENUM ('manufacturer', 'employer', 'both');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS organization_kind public.organization_kind NOT NULL DEFAULT 'manufacturer',
  ADD COLUMN IF NOT EXISTS public_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS public_employer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS employer_tagline text,
  ADD COLUMN IF NOT EXISTS employer_about text,
  ADD COLUMN IF NOT EXISTS employer_logo_url text,
  ADD COLUMN IF NOT EXISTS employer_cover_url text,
  ADD COLUMN IF NOT EXISTS employer_website text,
  ADD COLUMN IF NOT EXISTS employer_linkedin text,
  ADD COLUMN IF NOT EXISTS employer_hiring_email text,
  ADD COLUMN IF NOT EXISTS employer_locations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employer_industries text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employer_paid_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS employer_paid_contact_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_organizations_public_employer
  ON public.organizations (public_slug)
  WHERE public_employer = true;

-- Allow anonymous read of public employer pages (org name + branding only, never financial fields)
DROP POLICY IF EXISTS "organizations_public_employer_select" ON public.organizations;
CREATE POLICY "organizations_public_employer_select"
  ON public.organizations
  FOR SELECT
  TO anon, authenticated
  USING (public_employer = true);

-- 2. Operator profile mini-site fields
ALTER TABLE public.operator_profiles
  ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS business_hours jsonb,
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS vcard_full_name text,
  ADD COLUMN IF NOT EXISTS vcard_title text,
  ADD COLUMN IF NOT EXISTS vcard_company text,
  ADD COLUMN IF NOT EXISTS theme_color text,
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS card_slug text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_operator_profiles_card_slug
  ON public.operator_profiles (card_slug)
  WHERE card_slug IS NOT NULL;

-- 3. Job postings
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  remote boolean NOT NULL DEFAULT false,
  employment_type text NOT NULL DEFAULT 'full_time',
  salary_min integer,
  salary_max integer,
  required_skills text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_public_select" ON public.job_postings;
CREATE POLICY "jobs_public_select"
  ON public.job_postings FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND (expires_at IS NULL OR expires_at > now()));

DROP POLICY IF EXISTS "jobs_org_manage" ON public.job_postings;
CREATE POLICY "jobs_org_manage"
  ON public.job_postings
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id));

DROP TRIGGER IF EXISTS tg_job_postings_updated_at ON public.job_postings;
CREATE TRIGGER tg_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_job_postings_org ON public.job_postings(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_published ON public.job_postings(published_at DESC) WHERE status = 'published';

-- 4. Profile views (analytics)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_type text NOT NULL CHECK (subject_type IN ('talent','employer','card')),
  subject_id text NOT NULL,
  viewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pv_anyone_insert" ON public.profile_views;
CREATE POLICY "pv_anyone_insert"
  ON public.profile_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "pv_owner_or_org_select" ON public.profile_views;
CREATE POLICY "pv_owner_or_org_select"
  ON public.profile_views FOR SELECT
  TO authenticated
  USING (
    -- Talent profile owner can see views of their own profile/card
    (subject_type IN ('talent','card') AND EXISTS (
      SELECT 1 FROM public.operator_profiles op
      WHERE op.user_id = auth.uid()
        AND (op.public_username = profile_views.subject_id OR op.card_slug = profile_views.subject_id)
    ))
    OR
    -- Employer org admins/supervisors can see views of their employer page
    (subject_type = 'employer' AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.public_slug = profile_views.subject_id
        AND (public.is_org_admin(auth.uid(), o.id) OR public.is_supervisor_in_org(auth.uid(), o.id))
    ))
  );

CREATE INDEX IF NOT EXISTS idx_profile_views_subject
  ON public.profile_views(subject_type, subject_id, created_at DESC);

-- 5. Threaded replies on talent contact requests
CREATE TABLE IF NOT EXISTS public.talent_message_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.talent_contact_requests(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('employer','candidate')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_message_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tmr_select" ON public.talent_message_replies;
CREATE POLICY "tmr_select"
  ON public.talent_message_replies FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.talent_contact_requests r
    WHERE r.id = talent_message_replies.request_id
      AND (
        r.candidate_user_id = auth.uid()
        OR public.is_org_admin(auth.uid(), r.organization_id)
        OR public.is_supervisor_in_org(auth.uid(), r.organization_id)
      )
  ));

DROP POLICY IF EXISTS "tmr_insert" ON public.talent_message_replies;
CREATE POLICY "tmr_insert"
  ON public.talent_message_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.talent_contact_requests r
      WHERE r.id = talent_message_replies.request_id
        AND (
          (sender_role = 'candidate' AND r.candidate_user_id = auth.uid())
          OR (sender_role = 'employer' AND (public.is_org_admin(auth.uid(), r.organization_id) OR public.is_supervisor_in_org(auth.uid(), r.organization_id)))
        )
    )
  );

CREATE INDEX IF NOT EXISTS idx_tmr_request ON public.talent_message_replies(request_id, created_at);