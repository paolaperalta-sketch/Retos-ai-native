
-- Probation adaptation goals (3-5 short goals set by leader)
CREATE TABLE public.probation_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.probation_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own probation goals"
  ON public.probation_goals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all probation goals"
  ON public.probation_goals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Leaders can manage reports probation goals"
  ON public.probation_goals FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'team_leader'::app_role)
    AND user_id IN (SELECT p.user_id FROM profiles p WHERE p.manager_email = get_user_email(auth.uid()))
  );

CREATE POLICY "Leaders can insert reports probation goals"
  ON public.probation_goals FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'team_leader'::app_role)
    AND user_id IN (SELECT p.user_id FROM profiles p WHERE p.manager_email = get_user_email(auth.uid()))
  );

CREATE TRIGGER update_probation_goals_updated_at
  BEFORE UPDATE ON public.probation_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Probation evaluations (checkin at 30 days, final at 57 days)
CREATE TABLE public.probation_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  evaluator_id UUID NOT NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('checkin', 'final')),
  responses JSONB DEFAULT '{}',
  passed_probation BOOLEAN,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, evaluation_type)
);

ALTER TABLE public.probation_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own probation evaluations"
  ON public.probation_evaluations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all probation evaluations"
  ON public.probation_evaluations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Evaluators can manage their evaluations"
  ON public.probation_evaluations FOR ALL TO authenticated
  USING (auth.uid() = evaluator_id);

CREATE POLICY "Evaluators can insert evaluations"
  ON public.probation_evaluations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = evaluator_id);

CREATE TRIGGER update_probation_evaluations_updated_at
  BEFORE UPDATE ON public.probation_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
