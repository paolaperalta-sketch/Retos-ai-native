CREATE OR REPLACE FUNCTION public.get_my_key_results()
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
      p.user_id,
      lower(p.email) AS email,
      p.full_name,
      public.name_match_tokens(p.full_name) AS tokens
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    LIMIT 1
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
  CROSS JOIN me
  WHERE
    kr.user_id = me.user_id
    OR lower(kr.assigned_email) = me.email
    OR (
      kr.assigned_full_name IS NOT NULL
      AND array_length(me.tokens, 1) >= 2
      AND position(me.tokens[1] in upper(kr.assigned_full_name)) > 0
      AND position(me.tokens[2] in upper(kr.assigned_full_name)) > 0
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_key_results() TO authenticated;