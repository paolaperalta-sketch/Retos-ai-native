
-- ============================================================
-- FIX: KRs autocalificación — datos inconsistentes
-- ============================================================
-- 1) Deduplicar KRs (mismo company_okr_id + nombre + asignado)
--    Mantener el más antiguo, borrar los duplicados.
-- 2) Limpiar nombres de KR contaminados con nombres de personas
-- 3) Poblar baseline / target numéricos desde monthly_targets
-- 4) Asignar weight equitativo entre los KRs de cada OKR de área
-- ============================================================

-- ---- 1. DEDUPE: borrar duplicados manteniendo el ctid menor ----
DELETE FROM key_results kr
USING key_results kr2
WHERE kr.company_okr_id = kr2.company_okr_id
  AND kr.name = kr2.name
  AND COALESCE(kr.assigned_email,'') = COALESCE(kr2.assigned_email,'')
  AND kr.ctid > kr2.ctid;

-- ---- 2. Limpiar nombre del KR de Culture Fit (quitar nombres) ----
UPDATE key_results
SET name = '★ Efectividad Culture Fit→Offer'
WHERE name ILIKE '%Culture Fit%Offer%'
  AND name ILIKE '%Karen Villamil%';

-- Limpiar otros KRs con nombres de personas embebidos (PEOPLE)
UPDATE key_results
SET name = '★ Tasa accidentalidad ≤0.71% todos los meses'
WHERE name ILIKE '%SHEILA%accidentalidad%';

-- ---- 3. Poblar baseline / target numéricos desde monthly_targets ----
-- Lee 'baseline' y 'meta_julio' (meta final del trimestre) del JSONB,
-- extrae solo dígitos / punto / signo.
UPDATE key_results
SET baseline = COALESCE(NULLIF(regexp_replace(monthly_targets->>'baseline','[^0-9.\-]','','g'),'')::numeric, 0),
    target   = COALESCE(NULLIF(regexp_replace(monthly_targets->>'meta_julio','[^0-9.\-]','','g'),'')::numeric, 0)
WHERE monthly_targets IS NOT NULL
  AND (target IS NULL OR target = 0);

-- ---- 4. Pesos equitativos por OKR de área para LEGAL y PEOPLE ----
-- (CX y ENERGY ya tienen weight). Cada KR = ROUND(100 / N, 2)
WITH counts AS (
  SELECT kr.company_okr_id, COUNT(*) AS n
  FROM key_results kr
  JOIN company_okrs co ON co.id = kr.company_okr_id
  WHERE co.area IN ('LEGAL','PEOPLE')
  GROUP BY kr.company_okr_id
)
UPDATE key_results kr
SET weight = ROUND(100.0 / c.n, 2)
FROM counts c
WHERE kr.company_okr_id = c.company_okr_id
  AND (kr.weight IS NULL OR kr.weight = 0);

-- ---- 5. Capitalización del OKR de compañía "Habilitador DE negocio" ----
UPDATE company_okrs
SET name = 'Habilitador de negocio'
WHERE name ILIKE 'Habilitador%negocio%';
