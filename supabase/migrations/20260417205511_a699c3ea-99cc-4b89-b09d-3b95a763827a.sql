-- ─────────────────────────────────────────────────────────────────────────────
-- Extend training_media_entity enum
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'oap_course' AND enumtypid = 'public.training_media_entity'::regtype) THEN
    ALTER TYPE public.training_media_entity ADD VALUE 'oap_course';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'oap_lesson' AND enumtypid = 'public.training_media_entity'::regtype) THEN
    ALTER TYPE public.training_media_entity ADD VALUE 'oap_lesson';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'oap_quiz_question' AND enumtypid = 'public.training_media_entity'::regtype) THEN
    ALTER TYPE public.training_media_entity ADD VALUE 'oap_quiz_question';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'oap_certificate' AND enumtypid = 'public.training_media_entity'::regtype) THEN
    ALTER TYPE public.training_media_entity ADD VALUE 'oap_certificate';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'gca_certificate' AND enumtypid = 'public.training_media_entity'::regtype) THEN
    ALTER TYPE public.training_media_entity ADD VALUE 'gca_certificate';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- OAP: courses, lessons, quizzes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.oap_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 7),
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  estimated_minutes INTEGER DEFAULT 60,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.oap_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.oap_courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL DEFAULT '',
  estimated_minutes INTEGER DEFAULT 10,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, slug)
);

CREATE TABLE public.oap_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.oap_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score_pct INTEGER NOT NULL DEFAULT 80 CHECK (passing_score_pct BETWEEN 0 AND 100),
  max_attempts INTEGER,
  time_limit_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.oap_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.oap_quizzes(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice','true_false','fill_in','multi_select')),
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.oap_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.oap_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  score_pct NUMERIC(5,2),
  passed BOOLEAN,
  duration_seconds INTEGER,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- OAP: role programs + enrollments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.oap_role_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  required_machine_tags TEXT[] DEFAULT '{}',
  required_inspection_tool_slugs TEXT[] DEFAULT '{}',
  required_machining_operation_slugs TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.oap_role_program_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_program_id UUID NOT NULL REFERENCES public.oap_role_programs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.oap_courses(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(role_program_id, course_id)
);

CREATE TABLE public.oap_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_program_id UUID NOT NULL REFERENCES public.oap_role_programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','paused','withdrawn')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_completion_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_program_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- OAP: certificates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.oap_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cert_id TEXT NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  role_program_id UUID REFERENCES public.oap_role_programs(id) ON DELETE SET NULL,
  program_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  pdf_url TEXT,
  stripe_session_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 1200,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.oap_certificate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES public.oap_certificates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('machine','inspection_tool','machining_operation','safety_credential','course')),
  item_slug TEXT,
  display_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────────────────
-- GCA: question banks, questions, attempts, certificates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.gca_question_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  passing_score_pct INTEGER NOT NULL DEFAULT 80 CHECK (passing_score_pct BETWEEN 0 AND 100),
  is_pro_only BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.gca_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_id UUID NOT NULL REFERENCES public.gca_question_banks(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice','true_false','fill_in','multi_select','drag_drop')),
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.gca_test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_id UUID NOT NULL REFERENCES public.gca_question_banks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score_pct NUMERIC(5,2),
  passed BOOLEAN,
  duration_seconds INTEGER,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.gca_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cert_id TEXT NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id UUID NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  bank_id UUID REFERENCES public.gca_question_banks(id) ON DELETE SET NULL,
  program_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  pdf_url TEXT,
  stripe_session_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 1200,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_oap_lessons_course ON public.oap_lessons(course_id, sort_order);
CREATE INDEX idx_oap_quiz_questions_quiz ON public.oap_quiz_questions(quiz_id, sort_order);
CREATE INDEX idx_oap_quiz_attempts_user ON public.oap_quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_oap_quiz_attempts_org ON public.oap_quiz_attempts(organization_id);
CREATE INDEX idx_oap_role_programs_org ON public.oap_role_programs(organization_id);
CREATE INDEX idx_oap_enrollments_user ON public.oap_enrollments(user_id);
CREATE INDEX idx_oap_enrollments_org ON public.oap_enrollments(organization_id);
CREATE INDEX idx_oap_certificates_user ON public.oap_certificates(user_id);
CREATE INDEX idx_oap_certificates_cert_id ON public.oap_certificates(cert_id);
CREATE INDEX idx_oap_certificate_items_cert ON public.oap_certificate_items(certificate_id);
CREATE INDEX idx_gca_questions_bank ON public.gca_questions(bank_id, sort_order);
CREATE INDEX idx_gca_test_attempts_user ON public.gca_test_attempts(user_id, bank_id);
CREATE INDEX idx_gca_certificates_user ON public.gca_certificates(user_id);
CREATE INDEX idx_gca_certificates_cert_id ON public.gca_certificates(cert_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_oap_courses_updated_at BEFORE UPDATE ON public.oap_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_oap_lessons_updated_at BEFORE UPDATE ON public.oap_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_oap_quizzes_updated_at BEFORE UPDATE ON public.oap_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_oap_quiz_questions_updated_at BEFORE UPDATE ON public.oap_quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_oap_role_programs_updated_at BEFORE UPDATE ON public.oap_role_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_oap_enrollments_updated_at BEFORE UPDATE ON public.oap_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_oap_certificates_updated_at BEFORE UPDATE ON public.oap_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gca_question_banks_updated_at BEFORE UPDATE ON public.gca_question_banks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gca_questions_updated_at BEFORE UPDATE ON public.gca_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gca_certificates_updated_at BEFORE UPDATE ON public.gca_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.oap_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_role_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_role_program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_certificate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gca_question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gca_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gca_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gca_certificates ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies — Authored content (read-all-authenticated, admin-write)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "Authored OAP courses readable by anyone" ON public.oap_courses
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins manage OAP courses" ON public.oap_courses
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "OAP lessons readable when published" ON public.oap_lessons
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins manage OAP lessons" ON public.oap_lessons
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "OAP quizzes readable when published" ON public.oap_quizzes
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins manage OAP quizzes" ON public.oap_quizzes
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "OAP quiz questions readable to authenticated" ON public.oap_quiz_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage OAP quiz questions" ON public.oap_quiz_questions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Quiz attempts: owner + org admins of attempt's org
CREATE POLICY "Users see their own OAP quiz attempts" ON public.oap_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert their own OAP quiz attempts" ON public.oap_quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own OAP quiz attempts" ON public.oap_quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Role programs: org-scoped
CREATE POLICY "Org members see their role programs" ON public.oap_role_programs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.organization_members om
               WHERE om.organization_id = oap_role_programs.organization_id
                 AND om.user_id = auth.uid())
  );
CREATE POLICY "Org admins manage role programs" ON public.oap_role_programs
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.organization_members om
               WHERE om.organization_id = oap_role_programs.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner','admin','supervisor'))
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.organization_members om
               WHERE om.organization_id = oap_role_programs.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner','admin','supervisor'))
  );

CREATE POLICY "Role program courses follow program" ON public.oap_role_program_courses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.oap_role_programs rp
            WHERE rp.id = oap_role_program_courses.role_program_id
              AND (public.has_role(auth.uid(), 'admin')
                   OR EXISTS (SELECT 1 FROM public.organization_members om
                              WHERE om.organization_id = rp.organization_id
                                AND om.user_id = auth.uid())))
  );
CREATE POLICY "Org admins manage role program courses" ON public.oap_role_program_courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.oap_role_programs rp
            WHERE rp.id = oap_role_program_courses.role_program_id
              AND (public.has_role(auth.uid(), 'admin')
                   OR EXISTS (SELECT 1 FROM public.organization_members om
                              WHERE om.organization_id = rp.organization_id
                                AND om.user_id = auth.uid()
                                AND om.role IN ('owner','admin','supervisor'))))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.oap_role_programs rp
            WHERE rp.id = oap_role_program_courses.role_program_id
              AND (public.has_role(auth.uid(), 'admin')
                   OR EXISTS (SELECT 1 FROM public.organization_members om
                              WHERE om.organization_id = rp.organization_id
                                AND om.user_id = auth.uid()
                                AND om.role IN ('owner','admin','supervisor'))))
  );

-- Enrollments: owner + org admins
CREATE POLICY "Users see their own enrollments" ON public.oap_enrollments
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.organization_members om
               WHERE om.organization_id = oap_enrollments.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner','admin','supervisor'))
  );
CREATE POLICY "Org admins manage enrollments" ON public.oap_enrollments
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.organization_members om
               WHERE om.organization_id = oap_enrollments.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner','admin','supervisor'))
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.organization_members om
               WHERE om.organization_id = oap_enrollments.organization_id
                 AND om.user_id = auth.uid()
                 AND om.role IN ('owner','admin','supervisor'))
  );

-- Certificates: public read by cert_id (for /verify), owner full read, admin write
CREATE POLICY "OAP certificates publicly verifiable" ON public.oap_certificates
  FOR SELECT USING (true);
CREATE POLICY "Platform admins manage OAP certificates" ON public.oap_certificates
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "OAP certificate items publicly readable" ON public.oap_certificate_items
  FOR SELECT USING (true);
CREATE POLICY "Platform admins manage OAP certificate items" ON public.oap_certificate_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- GCA banks + questions: read all, admin write
CREATE POLICY "GCA banks readable when published" ON public.gca_question_banks
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Platform admins manage GCA banks" ON public.gca_question_banks
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "GCA questions readable to authenticated" ON public.gca_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage GCA questions" ON public.gca_questions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- GCA attempts: owner only
CREATE POLICY "Users see their own GCA attempts" ON public.gca_test_attempts
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert their own GCA attempts" ON public.gca_test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own GCA attempts" ON public.gca_test_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- GCA certificates: public verify
CREATE POLICY "GCA certificates publicly verifiable" ON public.gca_certificates
  FOR SELECT USING (true);
CREATE POLICY "Platform admins manage GCA certificates" ON public.gca_certificates
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));