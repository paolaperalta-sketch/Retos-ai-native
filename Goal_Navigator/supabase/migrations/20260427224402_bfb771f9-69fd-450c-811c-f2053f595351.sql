-- Allow users to read shared KRs where their full name appears as a token
-- in the comma-separated assigned_full_name field (e.g. "PAOLA PERALTA, KAREN VILLAMIL").
CREATE POLICY "Users read shared KRs by full name"
ON public.key_results
FOR SELECT
TO authenticated
USING (
  assigned_full_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.full_name IS NOT NULL
      AND position(upper(split_part(p.full_name, ' ', 1)) IN upper(assigned_full_name)) > 0
      AND position(upper(split_part(p.full_name, ' ', 2)) IN upper(assigned_full_name)) > 0
  )
);