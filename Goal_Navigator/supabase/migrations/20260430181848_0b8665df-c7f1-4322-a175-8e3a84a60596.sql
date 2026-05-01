CREATE OR REPLACE FUNCTION public.get_owned_area_key_results(
  _target_user_id uuid DEFAULT NULL,
  _target_email text DEFAULT NULL,
  _target_full_name text DEFAULT NULL
)
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
    SELECT
      CASE WHEN public.has_role(auth.uid(), 'super_admin') THEN _target_user_id ELSE p.user_id END AS user_id,
      lower(CASE WHEN public.has_role(auth.uid(), 'super_admin') THEN _target_email ELSE p.email END) AS email,
      CASE WHEN public.has_role(auth.uid(), 'super_admin') THEN _target_full_name ELSE p.full_name END AS full_name,
      public.name_match_tokens(CASE WHEN public.has_role(auth.uid(), 'super_admin') THEN _target_full_name ELSE p.full_name END) AS tokens
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    LIMIT 1
  ), owned_company_okrs AS (
    SELECT co.id
    FROM public.company_okrs co
    CROSS JOIN me
    WHERE
      (me.email IS NOT NULL AND lower(co.okr_owner_email) = me.email)
      OR (
        co.okr_owner_full_name IS NOT NULL
        AND array_length(me.tokens, 1) >= 2
        AND position(me.tokens[1] in upper(co.okr_owner_full_name)) > 0
        AND position(me.tokens[2] in upper(co.okr_owner_full_name)) > 0
      )
  )
  SELECT
    kr.id,
    kr.name,
    kr.baseline,
    kr.target,
    kr.current_value,
    kr.weight,
    kr.status,
    kr.assigned_email,
    kr.assigned_full_name,
    kr.user_id,
    kr.company_okr_id,
    kr.monthly_targets,
    kr.closing_month
  FROM public.key_results kr
  WHERE kr.company_okr_id IN (SELECT id FROM owned_company_okrs);
$$;

REVOKE ALL ON FUNCTION public.get_owned_area_key_results(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owned_area_key_results(uuid, text, text) TO authenticated;