
-- 1) New company OKR table
CREATE TABLE IF NOT EXISTS public.okr_company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nombre text NOT NULL,
  area text NOT NULL,
  okr_statement text,
  owner_full_name text,
  owner_email text,
  activo boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_company ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read okr_company"
  ON public.okr_company FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage okr_company"
  ON public.okr_company FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER okr_company_set_updated
  BEFORE UPDATE ON public.okr_company
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Extend key_results
ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS assigned_full_name text,
  ADD COLUMN IF NOT EXISTS assigned_email text,
  ADD COLUMN IF NOT EXISTS frecuencia text,
  ADD COLUMN IF NOT EXISTS monthly_targets jsonb,
  ADD COLUMN IF NOT EXISTS company_okr_id uuid REFERENCES public.okr_company(id) ON DELETE SET NULL;

ALTER TABLE public.key_results ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.key_results ALTER COLUMN okr_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_key_results_assigned_email
  ON public.key_results (lower(assigned_email))
  WHERE assigned_email IS NOT NULL;

-- 3) RLS: read/update pre-assigned KRs even without profile linked yet
CREATE POLICY "Users read own or pre-assigned KRs"
  ON public.key_results FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id)
    OR (user_id IS NULL AND lower(assigned_email) = lower(get_user_email(auth.uid())))
  );

CREATE POLICY "Users update own or claim pre-assigned KRs"
  ON public.key_results FOR UPDATE TO authenticated
  USING (
    (auth.uid() = user_id)
    OR (user_id IS NULL AND lower(assigned_email) = lower(get_user_email(auth.uid())))
  )
  WITH CHECK (
    (auth.uid() = user_id)
    OR (user_id IS NULL AND lower(assigned_email) = lower(get_user_email(auth.uid())))
  );

-- 4) Auto-claim KRs when user creates profile
CREATE OR REPLACE FUNCTION public.claim_krs_for_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.key_results
     SET user_id = NEW.user_id
   WHERE user_id IS NULL
     AND lower(assigned_email) = lower(NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_claim_krs_for_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_krs_for_new_profile();

-- Also ensure the existing operational tasks claim trigger is wired
DROP TRIGGER IF EXISTS trg_claim_tasks_for_new_profile ON public.profiles;
CREATE TRIGGER trg_claim_tasks_for_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_tasks_for_new_profile();
