
-- Create a SECURITY DEFINER function to get user's area without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_area(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT area FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Team leaders can read area profiles" ON public.profiles;

-- Recreate using the security definer function
CREATE POLICY "Team leaders can read area profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role)
  AND area = get_user_area(auth.uid())
);
