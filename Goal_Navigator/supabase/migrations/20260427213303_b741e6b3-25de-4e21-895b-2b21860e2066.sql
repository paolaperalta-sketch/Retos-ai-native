-- ============================================================
-- FASE 3: Backfill company_okr_id, kr_type y sanitizar nombres
-- ============================================================
DO $$
DECLARE
  v_company_count INTEGER;
  v_orphan_count INTEGER;
  v_total_krs INTEGER;
BEGIN
  -- ── Step 1: Poblar company_okrs (1 fila por (pillar, area) presente en okr_areas) ──
  INSERT INTO public.company_okrs (pillar_id, name, area, sort_order, activo)
  SELECT DISTINCT
    a.pillar_id,
    p.name,
    a.area,
    p.sort_order,
    true
  FROM public.okr_areas a
  JOIN public.okr_pillars p ON p.id = a.pillar_id
  ON CONFLICT DO NOTHING;

  SELECT COUNT(*) INTO v_company_count FROM public.company_okrs;
  RAISE NOTICE 'company_okrs poblada: % filas', v_company_count;

  -- ── Step 2: Backfill key_results.company_okr_id ──
  -- Cadena: key_results.okr_id -> okr_individual.area_okr_id -> okr_areas (pillar_id, area)
  -- -> company_okrs (matching pillar_id + area)
  UPDATE public.key_results kr
  SET company_okr_id = co.id
  FROM public.okr_individual oi
  JOIN public.okr_areas oa ON oa.id = oi.area_okr_id
  JOIN public.company_okrs co ON co.pillar_id = oa.pillar_id AND co.area = oa.area
  WHERE kr.okr_id = oi.id
    AND kr.company_okr_id IS NULL;

  SELECT COUNT(*) INTO v_orphan_count FROM public.key_results WHERE company_okr_id IS NULL;
  SELECT COUNT(*) INTO v_total_krs FROM public.key_results;
  RAISE NOTICE 'KRs sin company_okr_id tras backfill: % de %', v_orphan_count, v_total_krs;

  -- ── Step 3: Backfill kr_type (★ marker = company OKR; resto = individual) ──
  UPDATE public.key_results
  SET kr_type = CASE
    WHEN name LIKE '%★%' THEN 'company'
    ELSE 'individual'
  END
  WHERE kr_type IS NULL;

  -- ── Step 4: Sanitizar el nombre (quitar ★ y normalizar espacios) ──
  UPDATE public.key_results
  SET name = btrim(regexp_replace(name, '★', '', 'g'))
  WHERE name LIKE '%★%';

  -- Normalizar dobles espacios que pudieron quedar
  UPDATE public.key_results
  SET name = regexp_replace(name, '\s+', ' ', 'g')
  WHERE name ~ '\s{2,}';

  -- Validación final: si quedan huérfanos, abortar
  IF v_orphan_count > 0 THEN
    RAISE WARNING 'Atención: % KRs siguen sin company_okr_id', v_orphan_count;
  END IF;
END $$;

-- Añadir FK constraint ahora que los datos están consistentes (skip si ya existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'key_results_company_okr_id_fkey'
  ) THEN
    ALTER TABLE public.key_results
      ADD CONSTRAINT key_results_company_okr_id_fkey
      FOREIGN KEY (company_okr_id) REFERENCES public.company_okrs(id) ON DELETE SET NULL;
  END IF;
END $$;