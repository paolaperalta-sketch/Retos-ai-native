-- Make user_id nullable + add assigned_email
ALTER TABLE public.operational_tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.operational_tasks ADD COLUMN assigned_email TEXT;
CREATE INDEX idx_op_tasks_assigned_email ON public.operational_tasks(lower(assigned_email));

-- Trigger: when a profile is created, claim all tasks pre-assigned to that email
CREATE OR REPLACE FUNCTION public.claim_tasks_for_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.operational_tasks
  SET user_id = NEW.user_id
  WHERE user_id IS NULL
    AND lower(assigned_email) = lower(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_claim_tasks_on_profile_insert ON public.profiles;
CREATE TRIGGER trg_claim_tasks_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.claim_tasks_for_new_profile();

-- Update SELECT policy so people see tasks pre-assigned to their email
DROP POLICY IF EXISTS "Users manage own tasks" ON public.operational_tasks;

CREATE POLICY "Users read own or pre-assigned tasks"
  ON public.operational_tasks FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND lower(assigned_email) = lower(get_user_email(auth.uid())))
  );

CREATE POLICY "Users insert own tasks"
  ON public.operational_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own or claim pre-assigned tasks"
  ON public.operational_tasks FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND lower(assigned_email) = lower(get_user_email(auth.uid())))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (user_id IS NULL AND lower(assigned_email) = lower(get_user_email(auth.uid())))
  );

CREATE POLICY "Users delete own tasks"
  ON public.operational_tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Team leaders read tasks of their reports (by user_id OR by email)
DROP POLICY IF EXISTS "Team leaders read reports tasks" ON public.operational_tasks;
CREATE POLICY "Team leaders read reports tasks"
  ON public.operational_tasks FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'team_leader'::app_role)
    AND (
      user_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE p.manager_email = get_user_email(auth.uid())
      )
      OR lower(assigned_email) IN (
        SELECT lower(um.email) FROM public.users_master um
        WHERE um.manager_email = get_user_email(auth.uid())
      )
    )
  );