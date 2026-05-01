
-- 1. Profiles table (central user hub)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  area TEXT,
  subarea TEXT,
  cargo TEXT,
  contribucion TEXT,
  manager_email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Global leaders can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'global_leader'));

CREATE POLICY "Team leaders can read area profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'team_leader') AND
    area = (SELECT p.area FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 2. OKR Pillars (company-level strategic objectives)
CREATE TABLE public.okr_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read pillars" ON public.okr_pillars
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage pillars" ON public.okr_pillars
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 3. OKR Areas (area-level objectives linked to pillars)
CREATE TABLE public.okr_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id UUID NOT NULL REFERENCES public.okr_pillars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  progress NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read area OKRs" ON public.okr_areas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage area OKRs" ON public.okr_areas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 4. Individual OKRs (linked to user and area OKR)
CREATE TABLE public.okr_individual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  area_okr_id UUID REFERENCES public.okr_areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  period TEXT DEFAULT 'Q2-2025',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_individual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own OKRs" ON public.okr_individual
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all OKRs" ON public.okr_individual
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Global leaders can read all OKRs" ON public.okr_individual
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'global_leader'));

CREATE POLICY "Leaders can manage reports OKRs" ON public.okr_individual
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'team_leader') AND
    user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.manager_email = (SELECT p2.email FROM public.profiles p2 WHERE p2.user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "Super admins can manage all OKRs" ON public.okr_individual
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. Key Results
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID NOT NULL REFERENCES public.okr_individual(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  baseline NUMERIC(12,2) DEFAULT 0,
  current_value NUMERIC(12,2) DEFAULT 0,
  target NUMERIC(12,2) DEFAULT 0,
  weight NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  comment TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own KRs" ON public.key_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all KRs" ON public.key_results
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Global leaders can read all KRs" ON public.key_results
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'global_leader'));

CREATE POLICY "Leaders can manage reports KRs" ON public.key_results
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'team_leader') AND
    user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.manager_email = (SELECT p2.email FROM public.profiles p2 WHERE p2.user_id = auth.uid() LIMIT 1)
    )
  );

-- 6. Performance History (monthly snapshots)
CREATE TABLE public.performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  kr_name TEXT NOT NULL,
  pillar TEXT,
  area TEXT,
  baseline NUMERIC(12,2) DEFAULT 0,
  resultado NUMERIC(12,2) DEFAULT 0,
  goal NUMERIC(12,2) DEFAULT 0,
  pct_cumplimiento NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own history" ON public.performance_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all history" ON public.performance_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Global leaders can read all history" ON public.performance_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'global_leader'));

CREATE POLICY "Super admins can manage history" ON public.performance_history
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 7. Academy Progress (future module)
CREATE TABLE public.academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  module_id TEXT,
  module_name TEXT,
  completed BOOLEAN DEFAULT false,
  score NUMERIC(5,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own academy progress" ON public.academy_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own academy progress" ON public.academy_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage academy" ON public.academy_progress
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 8. Review Cycles (future module)
CREATE TABLE public.review_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  cycle_name TEXT NOT NULL,
  period TEXT NOT NULL,
  overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
  ai_mindset_score NUMERIC(5,2),
  project_delivery_score NUMERIC(5,2),
  comment TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'published')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reviews" ON public.review_cycles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can manage their reviews" ON public.review_cycles
  FOR ALL TO authenticated USING (auth.uid() = reviewer_id);

CREATE POLICY "Super admins can manage all reviews" ON public.review_cycles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- Indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_area ON public.profiles(area);
CREATE INDEX idx_profiles_manager ON public.profiles(manager_email);
CREATE INDEX idx_okr_individual_user ON public.okr_individual(user_id);
CREATE INDEX idx_key_results_okr ON public.key_results(okr_id);
CREATE INDEX idx_key_results_user ON public.key_results(user_id);
CREATE INDEX idx_perf_history_user_month ON public.performance_history(user_id, month);
CREATE INDEX idx_academy_user ON public.academy_progress(user_id);
CREATE INDEX idx_reviews_user ON public.review_cycles(user_id);
CREATE INDEX idx_reviews_reviewer ON public.review_cycles(reviewer_id);

-- Timestamp trigger function (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_okr_individual_updated_at BEFORE UPDATE ON public.okr_individual
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_cycles_updated_at BEFORE UPDATE ON public.review_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.key_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_history;
