-- =========================================
-- 1. okr_periods
-- =========================================
CREATE TABLE public.okr_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  meta_porcentaje NUMERIC NOT NULL DEFAULT 80,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read periods"
  ON public.okr_periods FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage periods"
  ON public.okr_periods FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_okr_periods_updated_at
  BEFORE UPDATE ON public.okr_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 2. operational_tasks
-- =========================================
CREATE TABLE public.operational_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  okr_period_id UUID NOT NULL REFERENCES public.okr_periods(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  frecuencia TEXT NOT NULL,
  tiempo_minutos INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','en_progreso','automatizada')),
  fecha_automatizada TIMESTAMPTZ,
  herramienta_usada TEXT,
  evidencia_url TEXT,
  origen TEXT NOT NULL DEFAULT 'mapeo' CHECK (origen IN ('mapeo','manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_op_tasks_user ON public.operational_tasks(user_id);
CREATE INDEX idx_op_tasks_period ON public.operational_tasks(okr_period_id);
CREATE INDEX idx_op_tasks_estado ON public.operational_tasks(estado);

ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON public.operational_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team leaders read reports tasks"
  ON public.operational_tasks FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'team_leader'::app_role)
    AND user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.manager_email = get_user_email(auth.uid())
    )
  );

CREATE POLICY "Global leaders read all tasks"
  ON public.operational_tasks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'global_leader'::app_role));

CREATE POLICY "Super admins manage all tasks"
  ON public.operational_tasks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_operational_tasks_updated_at
  BEFORE UPDATE ON public.operational_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 3. task_comments
-- =========================================
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.operational_tasks(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  is_leader_comment BOOLEAN NOT NULL DEFAULT false,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Owner of the task can read all comments on it
CREATE POLICY "Task owner reads comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (
    task_id IN (SELECT id FROM public.operational_tasks WHERE user_id = auth.uid())
  );

-- Owner can insert own comments
CREATE POLICY "Task owner inserts own comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND task_id IN (SELECT id FROM public.operational_tasks WHERE user_id = auth.uid())
  );

-- Author can update/delete own comments
CREATE POLICY "Author updates own comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid());

CREATE POLICY "Author deletes own comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (author_user_id = auth.uid());

-- Team leader can read comments on reports' tasks
CREATE POLICY "Team leaders read reports comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'team_leader'::app_role)
    AND task_id IN (
      SELECT t.id FROM public.operational_tasks t
      JOIN public.profiles p ON p.user_id = t.user_id
      WHERE p.manager_email = get_user_email(auth.uid())
    )
  );

-- Team leader can insert leader comments on reports' tasks
CREATE POLICY "Team leaders comment on reports tasks"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND has_role(auth.uid(), 'team_leader'::app_role)
    AND task_id IN (
      SELECT t.id FROM public.operational_tasks t
      JOIN public.profiles p ON p.user_id = t.user_id
      WHERE p.manager_email = get_user_email(auth.uid())
    )
  );

-- Global leaders read all comments
CREATE POLICY "Global leaders read all comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'global_leader'::app_role));

-- Super admins do everything
CREATE POLICY "Super admins manage all comments"
  ON public.task_comments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =========================================
-- 4. Seed periodo activo
-- =========================================
INSERT INTO public.okr_periods (nombre, descripcion, meta_porcentaje, fecha_inicio, fecha_fin, activo)
VALUES (
  'Automatización Mayo 2026',
  'Automatizar el 80% de las tareas operativas mapeadas por cada persona durante el mes de mayo.',
  80,
  '2026-05-01',
  '2026-05-31',
  true
);