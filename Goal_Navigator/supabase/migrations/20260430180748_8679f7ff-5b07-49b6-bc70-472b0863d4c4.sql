-- Performance indexes for OKR module hot paths
CREATE INDEX IF NOT EXISTS idx_key_results_user_id ON public.key_results(user_id);
CREATE INDEX IF NOT EXISTS idx_key_results_assigned_email_lower ON public.key_results(lower(assigned_email));
CREATE INDEX IF NOT EXISTS idx_key_results_company_okr_id ON public.key_results(company_okr_id);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON public.key_results(okr_id);

CREATE INDEX IF NOT EXISTS idx_company_okrs_pillar_id ON public.company_okrs(pillar_id);
CREATE INDEX IF NOT EXISTS idx_company_okrs_owner_email_lower ON public.company_okrs(lower(okr_owner_email));

CREATE INDEX IF NOT EXISTS idx_operational_tasks_user_id ON public.operational_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_assigned_email_lower ON public.operational_tasks(lower(assigned_email));
CREATE INDEX IF NOT EXISTS idx_operational_tasks_estado ON public.operational_tasks(estado);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_validation_status ON public.operational_tasks(validation_status);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_period ON public.operational_tasks(okr_period_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_manager_email_lower ON public.profiles(lower(manager_email));
CREATE INDEX IF NOT EXISTS idx_profiles_area ON public.profiles(area);

CREATE INDEX IF NOT EXISTS idx_monthly_checkins_user_id ON public.monthly_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_checkins_kr_id ON public.monthly_checkins(kr_id);
CREATE INDEX IF NOT EXISTS idx_kr_accountability_user_id ON public.kr_accountability(user_id);
CREATE INDEX IF NOT EXISTS idx_kr_accountability_kr_id ON public.kr_accountability(kr_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);