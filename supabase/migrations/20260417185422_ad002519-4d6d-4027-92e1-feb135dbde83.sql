
-- 1. gca_professional_profiles
CREATE TABLE public.gca_professional_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  location TEXT,
  years_experience INTEGER,
  specialty TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gca_professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own GCA profile"
  ON public.gca_professional_profiles FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users insert own GCA profile"
  ON public.gca_professional_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own GCA profile"
  ON public.gca_professional_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own GCA profile"
  ON public.gca_professional_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_gca_professional_profiles_updated_at
  BEFORE UPDATE ON public.gca_professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. gca_machine_experience
CREATE TABLE public.gca_machine_experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_type TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  controller TEXT,
  proficiency TEXT NOT NULL DEFAULT 'beginner' CHECK (proficiency IN ('beginner','intermediate','advanced','expert')),
  years_used NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gca_machine_experience_user ON public.gca_machine_experience(user_id);

ALTER TABLE public.gca_machine_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own machine experience or public"
  ON public.gca_machine_experience FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.gca_professional_profiles p
      WHERE p.user_id = gca_machine_experience.user_id AND p.is_public = true
    )
  );

CREATE POLICY "Users insert own machine experience"
  ON public.gca_machine_experience FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own machine experience"
  ON public.gca_machine_experience FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own machine experience"
  ON public.gca_machine_experience FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_gca_machine_experience_updated_at
  BEFORE UPDATE ON public.gca_machine_experience
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. gca_accomplishments
CREATE TABLE public.gca_accomplishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('certification','course','project','award','oap')),
  title TEXT NOT NULL,
  issuer TEXT,
  description TEXT,
  earned_date DATE,
  expires_date DATE,
  reference_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gca_accomplishments_user ON public.gca_accomplishments(user_id);

ALTER TABLE public.gca_accomplishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own accomplishments or public"
  ON public.gca_accomplishments FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.gca_professional_profiles p
      WHERE p.user_id = gca_accomplishments.user_id AND p.is_public = true
    )
  );

CREATE POLICY "Users insert own accomplishments"
  ON public.gca_accomplishments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own accomplishments"
  ON public.gca_accomplishments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own accomplishments"
  ON public.gca_accomplishments FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_gca_accomplishments_updated_at
  BEFORE UPDATE ON public.gca_accomplishments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. gca_measurement_tools_tested
CREATE TABLE public.gca_measurement_tools_tested (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_category TEXT,
  precision_spec TEXT,
  proficiency TEXT NOT NULL DEFAULT 'beginner' CHECK (proficiency IN ('beginner','intermediate','advanced','expert')),
  notes TEXT,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gca_measurement_tools_user ON public.gca_measurement_tools_tested(user_id);

ALTER TABLE public.gca_measurement_tools_tested ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own measurement tools or public"
  ON public.gca_measurement_tools_tested FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.gca_professional_profiles p
      WHERE p.user_id = gca_measurement_tools_tested.user_id AND p.is_public = true
    )
  );

CREATE POLICY "Users insert own measurement tools"
  ON public.gca_measurement_tools_tested FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own measurement tools"
  ON public.gca_measurement_tools_tested FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own measurement tools"
  ON public.gca_measurement_tools_tested FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_gca_measurement_tools_tested_updated_at
  BEFORE UPDATE ON public.gca_measurement_tools_tested
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
