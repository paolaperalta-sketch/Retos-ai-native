-- Allow super admins to delete KRs
CREATE POLICY "Super admins can delete KRs"
ON public.key_results
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow team leaders to delete their reports' KRs
CREATE POLICY "Leaders can delete reports KRs"
ON public.key_results
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.manager_email = get_user_email(auth.uid())
  )
);

-- Allow super admins to insert KRs
CREATE POLICY "Super admins can insert KRs"
ON public.key_results
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow team leaders to insert KRs for their reports
CREATE POLICY "Leaders can insert reports KRs"
ON public.key_results
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'team_leader'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.manager_email = get_user_email(auth.uid())
  )
);

-- Allow users to update their own KRs
CREATE POLICY "Users can update own KRs"
ON public.key_results
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
