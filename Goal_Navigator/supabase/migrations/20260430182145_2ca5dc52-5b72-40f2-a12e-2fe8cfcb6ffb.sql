
-- Optimized RPC for team leader page: returns only KRs that belong to people
-- the current leader can see (their direct/indirect reports), via user_id,
-- email or full-name token match. Bypasses heavy RLS.
CREATE OR REPLACE FUNCTION public.get_team_key_results()
RETURNS TABLE (
  id uuid,
  name text,
  baseline numeric,
  target numeric,
  current_value numeric,
  weight numeric,
  status text,
  assigned_email text,
  assigned_full_name text,
  user_id uuid,
  company_okr_id uuid,
  monthly_targets jsonb,
  closing_month text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid, lower(get_user_email(auth.uid())) AS email
  ),
  -- Reports for team_leader (recursive via users_master.manager_email)
  report_emails AS (
    SELECT lower(um.email) AS email
    FROM public.users_master um, me
    WHERE um.manager_email = me.email
      AND um.deleted_at IS NULL
    UNION
    SELECT lower(um2.email)
    FROM public.users_master um2
    JOIN public.users_master um1 ON um1.email = um2.manager_email
    JOIN me ON um1.manager_email = me.email
    WHERE um1.deleted_at IS NULL AND um2.deleted_at IS NULL
  ),
  report_user_ids AS (
    SELECT p.user_id
    FROM public.profiles p
    JOIN report_emails re ON lower(p.email) = re.email
  ),
  report_full_names AS (
    SELECT DISTINCT um.full_name
    FROM public.users_master um
    JOIN report_emails re ON lower(um.email) = re.email
    WHERE um.full_name IS NOT NULL
  )
  SELECT
    kr.id, kr.name, kr.baseline, kr.target, kr.current_value, kr.weight,
    kr.status, kr.assigned_email, kr.assigned_full_name, kr.user_id,
    kr.company_okr_id, kr.monthly_targets, kr.closing_month
  FROM public.key_results kr
  WHERE
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'global_leader')
    OR kr.user_id IN (SELECT user_id FROM report_user_ids)
    OR lower(kr.assigned_email) IN (SELECT email FROM report_emails)
    OR EXISTS (
      SELECT 1 FROM report_full_names rfn
      WHERE kr.assigned_full_name IS NOT NULL
        AND (
          upper(kr.assigned_full_name) LIKE '%' || upper(rfn.full_name) || '%'
          OR upper(rfn.full_name) LIKE '%' || upper(split_part(kr.assigned_full_name, ',', 1)) || '%'
        )
    );
$$;

REVOKE ALL ON FUNCTION public.get_team_key_results() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_key_results() TO authenticated;
