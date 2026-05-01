CREATE POLICY "Owner of area OKR reads its KRs"
ON public.key_results
FOR SELECT
TO authenticated
USING (
  company_okr_id IN (
    SELECT id FROM public.company_okrs
    WHERE lower(okr_owner_email) = lower(public.get_user_email(auth.uid()))
  )
);