
-- Create a SECURITY DEFINER function to get user's email without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Fix key_results policy
DROP POLICY IF EXISTS "Leaders can manage reports KRs" ON public.key_results;
CREATE POLICY "Leaders can manage reports KRs"
ON public.key_results
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.manager_email = get_user_email(auth.uid())
  )
);

-- Fix okr_individual policy
DROP POLICY IF EXISTS "Leaders can manage reports OKRs" ON public.okr_individual;
CREATE POLICY "Leaders can manage reports OKRs"
ON public.okr_individual
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.manager_email = get_user_email(auth.uid())
  )
);
