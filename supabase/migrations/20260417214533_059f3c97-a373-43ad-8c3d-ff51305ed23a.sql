
CREATE TABLE public.operator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  years_experience INTEGER,
  location_city TEXT,
  location_region TEXT,
  location_country TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_pdf_url TEXT,
  avatar_url TEXT,
  willing_to_relocate BOOLEAN NOT NULL DEFAULT false,
  open_to_work BOOLEAN NOT NULL DEFAULT false,
  is_discoverable BOOLEAN NOT NULL DEFAULT false,
  preferred_employment_types TEXT[] DEFAULT '{}',
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_verified_employer(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.subscriptions s ON s.organization_id = om.organization_id
    WHERE om.user_id = _user_id
      AND om.role IN ('owner','admin','supervisor')
      AND s.status IN ('active','trialing')
  ) OR public.has_role(_user_id, 'admin'::public.app_role);
$$;

CREATE POLICY "op_profile_owner_all" ON public.operator_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_profile_employer_select" ON public.operator_profiles FOR SELECT TO authenticated
USING (is_discoverable = true AND public.is_verified_employer(auth.uid()));
CREATE TRIGGER tg_operator_profiles_updated_at BEFORE UPDATE ON public.operator_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.operator_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  issued_date DATE,
  expires_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  attachment_url TEXT,
  verification_source TEXT NOT NULL DEFAULT 'self_reported',
  linked_cert_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_cert_owner_all" ON public.operator_certifications FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_cert_employer_select" ON public.operator_certifications FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.user_id = operator_certifications.user_id AND op.is_discoverable = true)
);
CREATE TRIGGER tg_operator_certifications_updated_at BEFORE UPDATE ON public.operator_certifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_op_certs_user ON public.operator_certifications(user_id);

CREATE TABLE public.operator_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  proficiency TEXT NOT NULL DEFAULT 'intermediate',
  years_used NUMERIC(4,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill)
);
ALTER TABLE public.operator_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_skill_owner_all" ON public.operator_skills FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_skill_employer_select" ON public.operator_skills FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.user_id = operator_skills.user_id AND op.is_discoverable = true)
);
CREATE INDEX idx_op_skills_user ON public.operator_skills(user_id);
CREATE INDEX idx_op_skills_skill ON public.operator_skills(skill);

CREATE TABLE public.operator_machine_proficiencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_category TEXT NOT NULL,
  machine_make TEXT,
  machine_model TEXT,
  control_type TEXT,
  proficiency TEXT NOT NULL DEFAULT 'intermediate',
  years_experience NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_machine_proficiencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_mach_owner_all" ON public.operator_machine_proficiencies FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_mach_employer_select" ON public.operator_machine_proficiencies FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.user_id = operator_machine_proficiencies.user_id AND op.is_discoverable = true)
);
CREATE INDEX idx_op_machines_user ON public.operator_machine_proficiencies(user_id);

CREATE TABLE public.operator_work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_work_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_wh_owner_all" ON public.operator_work_history FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_wh_employer_select" ON public.operator_work_history FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.user_id = operator_work_history.user_id AND op.is_discoverable = true)
);
CREATE TRIGGER tg_operator_work_history_updated_at BEFORE UPDATE ON public.operator_work_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_op_workhist_user ON public.operator_work_history(user_id);

CREATE TABLE public.operator_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_edu_owner_all" ON public.operator_education FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_edu_employer_select" ON public.operator_education FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.user_id = operator_education.user_id AND op.is_discoverable = true)
);

CREATE TABLE public.operator_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_name TEXT NOT NULL,
  relationship TEXT,
  company TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "op_ref_owner_all" ON public.operator_references FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_ref_employer_select" ON public.operator_references FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.user_id = operator_references.user_id AND op.is_discoverable = true)
);

CREATE TABLE public.talent_saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_saved_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "talent_lists_org_all" ON public.talent_saved_lists FOR ALL TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id));
CREATE TRIGGER tg_talent_lists_updated_at BEFORE UPDATE ON public.talent_saved_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.talent_saved_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.talent_saved_lists(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, candidate_user_id)
);
ALTER TABLE public.talent_saved_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "talent_cand_org_all" ON public.talent_saved_candidates FOR ALL TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id));
CREATE TRIGGER tg_talent_candidates_updated_at BEFORE UPDATE ON public.talent_saved_candidates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_talent_cand_list ON public.talent_saved_candidates(list_id);
CREATE INDEX idx_talent_cand_user ON public.talent_saved_candidates(candidate_user_id);

CREATE TABLE public.talent_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_name TEXT,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id),
  sender_display_name TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  candidate_response TEXT NOT NULL DEFAULT 'pending',
  candidate_response_message TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "talent_msg_emp_insert" ON public.talent_contact_requests FOR INSERT TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id))
);
CREATE POLICY "talent_msg_select" ON public.talent_contact_requests FOR SELECT TO authenticated
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_supervisor_in_org(auth.uid(), organization_id)
  OR candidate_user_id = auth.uid()
);
CREATE POLICY "talent_msg_candidate_update" ON public.talent_contact_requests FOR UPDATE TO authenticated
USING (candidate_user_id = auth.uid()) WITH CHECK (candidate_user_id = auth.uid());
CREATE INDEX idx_talent_contact_org ON public.talent_contact_requests(organization_id);
CREATE INDEX idx_talent_contact_candidate ON public.talent_contact_requests(candidate_user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('operator-profiles', 'operator-profiles', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "op_files_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'operator-profiles');
CREATE POLICY "op_files_user_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'operator-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "op_files_user_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'operator-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "op_files_user_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'operator-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
