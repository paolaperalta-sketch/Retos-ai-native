
-- 1. Catálogo de dimensiones
CREATE TABLE public.review_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  weight_individual numeric NOT NULL DEFAULT 0,
  weight_leader numeric NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'both',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Items (preguntas) de cada dimensión
CREATE TABLE public.review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id uuid NOT NULL REFERENCES public.review_dimensions(id) ON DELETE CASCADE,
  code text NOT NULL,
  question text NOT NULL,
  applies_to text NOT NULL DEFAULT 'both',
  is_scored boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dimension_id, code)
);

-- 3. Matriz de pesos por evaluador
CREATE TABLE public.review_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type text NOT NULL,
  dimension_code text NOT NULL,
  evaluator_role text NOT NULL,
  weight numeric NOT NULL,
  UNIQUE (profile_type, dimension_code, evaluator_role)
);

-- 4. Ciclo de evaluación de un colaborador
CREATE TABLE public.review_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_full_name text NOT NULL,
  profile_type text NOT NULL,
  period text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

-- 5. Evaluadores asignados al ciclo
CREATE TABLE public.review_evaluators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.review_assessments(id) ON DELETE CASCADE,
  evaluator_email text NOT NULL,
  evaluator_role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, evaluator_email, evaluator_role)
);

-- 6. Nominaciones de stakeholders (propuestas por colaborador, aprobadas por líder)
CREATE TABLE public.stakeholder_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.review_assessments(id) ON DELETE CASCADE,
  proposed_by uuid NOT NULL,
  stakeholder_email text NOT NULL,
  stakeholder_name text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Respuestas individuales por item y evaluador
CREATE TABLE public.review_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_assignment_id uuid NOT NULL REFERENCES public.review_evaluators(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.review_items(id) ON DELETE CASCADE,
  score int CHECK (score BETWEEN 1 AND 4),
  evidence text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluator_assignment_id, item_id)
);

-- 8. Resultado final agregado
CREATE TABLE public.review_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL UNIQUE REFERENCES public.review_assessments(id) ON DELETE CASCADE,
  total_score numeric NOT NULL,
  classification text NOT NULL,
  dimension_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para evidencia obligatoria en score = 4
CREATE OR REPLACE FUNCTION public.validate_evidence_for_top_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.score = 4 AND (NEW.evidence IS NULL OR length(trim(NEW.evidence)) < 10) THEN
    RAISE EXCEPTION 'Evidencia obligatoria (mínimo 10 caracteres) para calificación nivel 4 (Referente)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_evidence_top_score
BEFORE INSERT OR UPDATE ON public.review_responses
FOR EACH ROW EXECUTE FUNCTION public.validate_evidence_for_top_score();

CREATE TRIGGER trg_review_assessments_updated_at
BEFORE UPDATE ON public.review_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_review_responses_updated_at
BEFORE UPDATE ON public.review_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.review_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_evaluators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_results ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura pública autenticada, escritura solo super_admin
CREATE POLICY "Anyone authenticated can read dimensions" ON public.review_dimensions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage dimensions" ON public.review_dimensions FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone authenticated can read items" ON public.review_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage items" ON public.review_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone authenticated can read weights" ON public.review_weights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage weights" ON public.review_weights FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Assessments
CREATE POLICY "Evaluated user reads own assessment" ON public.review_assessments FOR SELECT TO authenticated USING (user_email = get_user_email(auth.uid()));
CREATE POLICY "Leader reads reports assessments" ON public.review_assessments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), user_email));
CREATE POLICY "Global leaders read all assessments" ON public.review_assessments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'global_leader'::app_role));
CREATE POLICY "Super admins manage assessments" ON public.review_assessments FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Leaders create assessments for reports" ON public.review_assessments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), user_email));
CREATE POLICY "Leaders update reports assessments" ON public.review_assessments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), user_email));

-- Evaluators
CREATE POLICY "Evaluator reads own assignments" ON public.review_evaluators FOR SELECT TO authenticated USING (evaluator_email = get_user_email(auth.uid()));
CREATE POLICY "Evaluated user reads own evaluators" ON public.review_evaluators FOR SELECT TO authenticated USING (assessment_id IN (SELECT id FROM public.review_assessments WHERE user_email = get_user_email(auth.uid())));
CREATE POLICY "Leader reads reports evaluators" ON public.review_evaluators FOR SELECT TO authenticated USING (assessment_id IN (SELECT id FROM public.review_assessments a WHERE has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), a.user_email)));
CREATE POLICY "Super admins manage evaluators" ON public.review_evaluators FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Leader manages reports evaluators" ON public.review_evaluators FOR ALL TO authenticated USING (assessment_id IN (SELECT id FROM public.review_assessments a WHERE has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), a.user_email)));
CREATE POLICY "Evaluator updates own status" ON public.review_evaluators FOR UPDATE TO authenticated USING (evaluator_email = get_user_email(auth.uid()));

-- Stakeholder nominations
CREATE POLICY "Evaluated proposes own nominations" ON public.stakeholder_nominations FOR INSERT TO authenticated WITH CHECK (proposed_by = auth.uid() AND assessment_id IN (SELECT id FROM public.review_assessments WHERE user_email = get_user_email(auth.uid())));
CREATE POLICY "Evaluated reads own nominations" ON public.stakeholder_nominations FOR SELECT TO authenticated USING (proposed_by = auth.uid() OR assessment_id IN (SELECT id FROM public.review_assessments WHERE user_email = get_user_email(auth.uid())));
CREATE POLICY "Leader reads reports nominations" ON public.stakeholder_nominations FOR SELECT TO authenticated USING (assessment_id IN (SELECT id FROM public.review_assessments a WHERE has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), a.user_email)));
CREATE POLICY "Leader approves reports nominations" ON public.stakeholder_nominations FOR UPDATE TO authenticated USING (assessment_id IN (SELECT id FROM public.review_assessments a WHERE has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), a.user_email)));
CREATE POLICY "Super admins manage nominations" ON public.stakeholder_nominations FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Responses
CREATE POLICY "Evaluator manages own responses" ON public.review_responses FOR ALL TO authenticated USING (evaluator_assignment_id IN (SELECT id FROM public.review_evaluators WHERE evaluator_email = get_user_email(auth.uid())));
CREATE POLICY "Evaluated reads own aggregated responses" ON public.review_responses FOR SELECT TO authenticated USING (evaluator_assignment_id IN (SELECT e.id FROM public.review_evaluators e JOIN public.review_assessments a ON a.id = e.assessment_id WHERE a.user_email = get_user_email(auth.uid())));
CREATE POLICY "Leader reads reports responses" ON public.review_responses FOR SELECT TO authenticated USING (evaluator_assignment_id IN (SELECT e.id FROM public.review_evaluators e JOIN public.review_assessments a ON a.id = e.assessment_id WHERE has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), a.user_email)));
CREATE POLICY "Super admins manage responses" ON public.review_responses FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Results
CREATE POLICY "Evaluated reads own result" ON public.review_results FOR SELECT TO authenticated USING (assessment_id IN (SELECT id FROM public.review_assessments WHERE user_email = get_user_email(auth.uid())));
CREATE POLICY "Leader reads reports results" ON public.review_results FOR SELECT TO authenticated USING (assessment_id IN (SELECT id FROM public.review_assessments a WHERE has_role(auth.uid(), 'team_leader'::app_role) AND is_manager_of(get_user_email(auth.uid()), a.user_email)));
CREATE POLICY "Global leaders read all results" ON public.review_results FOR SELECT TO authenticated USING (has_role(auth.uid(), 'global_leader'::app_role));
CREATE POLICY "Super admins manage results" ON public.review_results FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed: Dimensiones
INSERT INTO public.review_dimensions (code, name, description, weight_individual, weight_leader, applies_to, sort_order) VALUES
('ai_mindset', 'AI Mindset', 'Mentalidad de AI de primero', 0.15, 0.15, 'both', 1),
('culture', 'Valores y Cultura', 'Comportamientos esperados de la cultura Bia', 0.30, 0.30, 'both', 2),
('leadership', 'Liderazgo', 'Capacidades de liderazgo de equipo', 0.00, 0.20, 'leader', 3),
('performance', 'Desempeño', 'Cumplimiento de OKRs y proyectos', 0.55, 0.35, 'both', 4);

-- Seed: Items
WITH d AS (SELECT id, code FROM public.review_dimensions)
INSERT INTO public.review_items (dimension_id, code, question, applies_to, is_scored, sort_order)
SELECT d.id, x.code, x.q, x.applies, x.scored, x.ord FROM d JOIN (VALUES
  ('ai_mindset','A1','¿Propone soluciones con AI antes de explorar otras opciones?','both',true,1),
  ('ai_mindset','A2','¿Demuestra conocimiento aplicado más allá del uso superficial de herramientas?','both',true,2),
  ('ai_mindset','B1','¿Tomó iniciativas AI que no estaban en sus objetivos formales ni se las pidió nadie?','both',true,3),
  ('ai_mindset','B2','Ante obstáculos en un proyecto AI, ¿persiste y busca soluciones o se detiene?','both',true,4),
  ('ai_mindset','C1','¿Identifica el problema real detrás del síntoma antes de proponer una solución AI?','both',true,5),
  ('ai_mindset','C2','¿Las soluciones AI que construye son usadas por otros de forma autónoma?','both',true,6),
  ('culture','PSS','Problem Solver & Seeker: ¿Busca activamente problemas que resolver e incluso llega con soluciones pensadas?','both',true,1),
  ('culture','SM','Self Management: ¿Toma decisiones, asume consecuencias y avanza sin esperar instrucciones?','both',true,2),
  ('culture','ATP','A-Team Player: ¿Comparte conocimiento para que el equipo crezca y otros brillen?','both',true,3),
  ('culture','AD','Adaptability: ¿Adopta nuevas formas de trabajar con disposición real y lidera el cambio?','both',true,4),
  ('culture','UC','User Centric: ¿Pone al usuario en el centro de su trabajo y empatiza con su dolor real?','both',true,5),
  ('culture','FG','Fueguito: ¿Contagia energía y ambición para ir por el resultado? (Obligatorio, sin peso numérico)','both',false,6),
  ('leadership','L1','Coaching (Reto): ¿Desafía al equipo a dar el máximo y salir de su zona de confort?','leader',true,1),
  ('leadership','L2','Coaching (Feedback): ¿Da feedback directo, claro y orientado al crecimiento sin evitar conversaciones difíciles?','leader',true,2),
  ('leadership','L3','Disciplina y Coherencia: ¿Es coherente entre lo que dice y hace, cumpliendo compromisos con transparencia?','leader',true,3),
  ('leadership','L4','Seniority (IE): ¿Regula sus emociones, no transmite caos y da estabilidad al equipo en momentos de incertidumbre?','leader',true,4),
  ('performance','OKR','Cumplimiento de OKRs: Evaluación directa del cumplimiento de objetivos del trimestre','both',true,1),
  ('performance','PRJ','Proyecto AI Amigable: Entrega satisfactoria del proyecto interno específico','both',true,2)
) AS x(dim_code, code, q, applies, scored, ord) ON d.code = x.dim_code;

-- Seed: Pesos por evaluador 360°
INSERT INTO public.review_weights (profile_type, dimension_code, evaluator_role, weight) VALUES
-- Contribuidor Individual
('individual','ai_mindset','self',0.20),('individual','ai_mindset','leader',0.80),
('individual','performance','leader',1.00),
('individual','culture','self',0.10),('individual','culture','leader',0.60),('individual','culture','stakeholder',0.30),
-- Líder
('leader','ai_mindset','self',0.20),('leader','ai_mindset','leader',0.40),('leader','ai_mindset','team',0.40),
('leader','performance','leader',1.00),
('leader','culture','self',0.10),('leader','culture','leader',0.40),('leader','culture','stakeholder',0.20),('leader','culture','team',0.30),
('leader','leadership','self',0.10),('leader','leadership','leader',0.30),('leader','leadership','team',0.60);
