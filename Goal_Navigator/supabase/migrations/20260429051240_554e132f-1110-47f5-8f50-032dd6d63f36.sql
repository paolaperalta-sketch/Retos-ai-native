-- 1) Ampliar operational_tasks con campos de validación líder y respuestas AI Native
ALTER TABLE public.operational_tasks
  ADD COLUMN IF NOT EXISTS proceso_automatizado text,
  ADD COLUMN IF NOT EXISTS baseline_descripcion text,
  ADD COLUMN IF NOT EXISTS resultado_descripcion text,
  ADD COLUMN IF NOT EXISTS validation_status text NOT NULL DEFAULT 'no_aplica',
  ADD COLUMN IF NOT EXISTS leader_id uuid,
  ADD COLUMN IF NOT EXISTS leader_comment text,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- validation_status: 'no_aplica' (no marcada), 'pendiente' (marcada por colab), 'validada' (líder ok), 'rechazada' (líder rechazó)

-- 2) Política: líderes pueden actualizar (validar/rechazar) tareas de sus reportes
DROP POLICY IF EXISTS "Leaders update reports tasks" ON public.operational_tasks;
CREATE POLICY "Leaders update reports tasks"
  ON public.operational_tasks
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'team_leader'::app_role)
    AND (
      user_id IN (SELECT p.user_id FROM profiles p WHERE p.manager_email = get_user_email(auth.uid()))
      OR lower(assigned_email) IN (SELECT lower(um.email) FROM users_master um WHERE um.manager_email = get_user_email(auth.uid()))
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'team_leader'::app_role)
    AND (
      user_id IN (SELECT p.user_id FROM profiles p WHERE p.manager_email = get_user_email(auth.uid()))
      OR lower(assigned_email) IN (SELECT lower(um.email) FROM users_master um WHERE um.manager_email = get_user_email(auth.uid()))
    )
  );

-- 3) Tabla notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 4) Trigger para notificar al líder cuando un colaborador marca una tarea como automatizada
CREATE OR REPLACE FUNCTION public.notify_task_validation_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader_user_id uuid;
  v_collab_user_id uuid;
  v_collab_name text;
BEGIN
  -- Colaborador marcó tarea como pendiente de validación
  IF (TG_OP = 'UPDATE'
      AND COALESCE(OLD.validation_status,'no_aplica') <> 'pendiente'
      AND NEW.validation_status = 'pendiente') THEN
    SELECT p.user_id INTO v_leader_user_id
      FROM profiles p
     WHERE lower(p.email) = lower((
       SELECT manager_email FROM profiles WHERE user_id = NEW.user_id LIMIT 1
     ))
     LIMIT 1;
    SELECT full_name INTO v_collab_name FROM profiles WHERE user_id = NEW.user_id LIMIT 1;
    IF v_leader_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, payload)
      VALUES (
        v_leader_user_id,
        'task_validation_pending',
        COALESCE(v_collab_name,'Un colaborador') || ' marcó una tarea como automatizada',
        'Requiere tu validación: ' || left(NEW.descripcion, 120),
        '/equipo',
        jsonb_build_object('task_id', NEW.id, 'collaborator_id', NEW.user_id)
      );
    END IF;
  END IF;

  -- Líder validó
  IF (TG_OP = 'UPDATE'
      AND COALESCE(OLD.validation_status,'no_aplica') <> 'validada'
      AND NEW.validation_status = 'validada'
      AND NEW.user_id IS NOT NULL) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, payload)
    VALUES (
      NEW.user_id,
      'task_validated',
      'Tu tarea fue validada ✓',
      'Tu líder validó: ' || left(NEW.descripcion, 120),
      '/desempeno',
      jsonb_build_object('task_id', NEW.id)
    );
  END IF;

  -- Líder rechazó
  IF (TG_OP = 'UPDATE'
      AND COALESCE(OLD.validation_status,'no_aplica') <> 'rechazada'
      AND NEW.validation_status = 'rechazada'
      AND NEW.user_id IS NOT NULL) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, payload)
    VALUES (
      NEW.user_id,
      'task_rejected',
      'Tu tarea fue rechazada',
      COALESCE(NEW.leader_comment, 'Tu líder dejó un comentario. Revisa y vuelve a enviar.'),
      '/desempeno',
      jsonb_build_object('task_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_validation ON public.operational_tasks;
CREATE TRIGGER trg_notify_task_validation
  AFTER UPDATE ON public.operational_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_validation_changes();

-- 5) Habilitar realtime para notifications y operational_tasks (si no está)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;