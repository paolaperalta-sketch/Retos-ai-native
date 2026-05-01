
-- 1. Ajustar pesos de dimensiones existentes según PRD Q1 2026
UPDATE public.review_dimensions SET weight_individual = 0.40, weight_leader = 0.25 WHERE code = 'performance';
UPDATE public.review_dimensions SET weight_individual = 0.00, weight_leader = 0.20 WHERE code = 'leadership';

-- 2. Crear nueva dimensión "Competencias"
INSERT INTO public.review_dimensions (code, name, description, weight_individual, weight_leader, applies_to, sort_order)
VALUES ('competencies', 'Competencias', 'Habilidades técnicas y profesionales del rol', 0.15, 0.10, 'both', 5)
ON CONFLICT (code) DO UPDATE SET weight_individual = 0.15, weight_leader = 0.10;

-- 3. Items para Competencias (genéricos, evaluables 1-4)
WITH d AS (SELECT id FROM public.review_dimensions WHERE code = 'competencies')
INSERT INTO public.review_items (dimension_id, code, question, applies_to, is_scored, sort_order)
SELECT d.id, x.code, x.q, 'both', true, x.ord FROM d, (VALUES
  ('CMP1', 'Dominio Técnico: ¿Demuestra dominio de las herramientas y conocimientos clave de su rol?', 1),
  ('CMP2', 'Calidad de Entrega: ¿La calidad de su trabajo cumple o supera los estándares esperados?', 2),
  ('CMP3', 'Comunicación: ¿Comunica ideas, decisiones y avances con claridad y oportunidad?', 3),
  ('CMP4', 'Pensamiento Crítico: ¿Analiza información para tomar decisiones fundamentadas?', 4)
) AS x(code, q, ord)
ON CONFLICT (dimension_id, code) DO NOTHING;

-- 4. Recalibrar matriz de pesos 360° (limpiar y recargar)
DELETE FROM public.review_weights;

INSERT INTO public.review_weights (profile_type, dimension_code, evaluator_role, weight) VALUES
-- ===== Contribuidor Individual =====
('individual','ai_mindset','self',0.20),('individual','ai_mindset','leader',0.80),
('individual','performance','leader',1.00),
('individual','culture','self',0.10),('individual','culture','leader',0.60),('individual','culture','stakeholder',0.30),
('individual','competencies','self',0.20),('individual','competencies','leader',0.80),
-- ===== Líder =====
('leader','ai_mindset','self',0.20),('leader','ai_mindset','leader',0.40),('leader','ai_mindset','team',0.40),
('leader','performance','leader',1.00),
('leader','culture','self',0.10),('leader','culture','leader',0.40),('leader','culture','stakeholder',0.20),('leader','culture','team',0.30),
('leader','leadership','self',0.10),('leader','leadership','leader',0.30),('leader','leadership','team',0.60),
('leader','competencies','self',0.10),('leader','competencies','leader',0.50),('leader','competencies','team',0.40);
