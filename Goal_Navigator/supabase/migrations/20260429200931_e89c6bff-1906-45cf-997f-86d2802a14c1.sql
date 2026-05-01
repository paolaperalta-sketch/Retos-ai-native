
-- Fix Julian Martinez profile: link to his real auth user_id so login works
DO $$
DECLARE
  v_old uuid := '25a559d8-8dfc-4fe9-be83-ebf36901028e';
  v_new uuid := 'd3df4eaf-abfa-4e8a-9594-dee2ae20472f';
BEGIN
  -- Remove any stub profile that might exist on the new id (none expected)
  DELETE FROM public.profiles WHERE user_id = v_new;
  -- Re-point the existing profile to the real auth uid
  UPDATE public.profiles SET user_id = v_new WHERE user_id = v_old;
  -- Re-point related rows
  UPDATE public.key_results SET user_id = v_new WHERE user_id = v_old;
  UPDATE public.operational_tasks SET user_id = v_new WHERE user_id = v_old;
  UPDATE public.user_roles SET user_id = v_new WHERE user_id = v_old;
  UPDATE public.kr_accountability SET user_id = v_new WHERE user_id = v_old;
  UPDATE public.monthly_checkins SET user_id = v_new WHERE user_id = v_old;
  UPDATE public.academy_progress SET user_id = v_new WHERE user_id = v_old;
  UPDATE public.performance_history SET user_id = v_new WHERE user_id = v_old;
END $$;
