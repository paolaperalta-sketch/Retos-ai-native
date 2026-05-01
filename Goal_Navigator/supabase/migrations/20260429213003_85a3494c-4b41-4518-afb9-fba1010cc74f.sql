UPDATE public.key_results kr 
SET user_id = p.user_id 
FROM public.profiles p 
WHERE kr.user_id IS NULL 
  AND p.deleted_at IS NULL 
  AND lower(kr.assigned_email) = lower(p.email);