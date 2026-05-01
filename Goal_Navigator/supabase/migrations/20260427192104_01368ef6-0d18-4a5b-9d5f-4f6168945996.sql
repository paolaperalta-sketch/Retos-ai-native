
-- =========================================
-- FASE 2: NUEVO ESQUEMA (idempotente)
-- =========================================

-- 1) company_okrs
CREATE TABLE IF NOT EXISTS public.company_okrs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id    uuid NOT NULL REFERENCES public.okr_pillars(id) ON DELETE RESTRICT,
  name         text NOT NULL,
  area         text NOT NULL,
  description  text,
  sort_order   integer NOT NULL DEFAULT 0,
  activo       boolean NOT NULL DEFAULT true,
  legacy_area_okr_id uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_okrs_pillar ON public.company_okrs(pillar_id);
CREATE INDEX IF NOT EXISTS idx_company_okrs_area ON public.company_okrs(area);
CREATE INDEX IF NOT EXISTS idx_company_okrs_legacy ON public.company_okrs(legacy_area_okr_id);

ALTER TABLE public.company_okrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read company_okrs" ON public.company_okrs;
CREATE POLICY "Anyone authenticated can read company_okrs"
  ON public.company_okrs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Super admins can manage company_okrs" ON public.company_okrs;
CREATE POLICY "Super admins can manage company_okrs"
  ON public.company_okrs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP TRIGGER IF EXISTS trg_company_okrs_updated ON public.company_okrs;
CREATE TRIGGER trg_company_okrs_updated
  BEFORE UPDATE ON public.company_okrs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) FK en key_results.company_okr_id (drop + recreate por seguridad)
ALTER TABLE public.key_results
  DROP CONSTRAINT IF EXISTS key_results_company_okr_id_fkey;

ALTER TABLE public.key_results
  ADD CONSTRAINT key_results_company_okr_id_fkey
    FOREIGN KEY (company_okr_id) REFERENCES public.company_okrs(id) ON DELETE SET NULL;

-- 3) kr_type (sin default, NULL inicial — se pobla en FASE 3)
ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS kr_type text;

ALTER TABLE public.key_results
  DROP CONSTRAINT IF EXISTS key_results_kr_type_check;
ALTER TABLE public.key_results
  ADD CONSTRAINT key_results_kr_type_check
    CHECK (kr_type IS NULL OR kr_type IN ('individual', 'company', 'automation'));

CREATE INDEX IF NOT EXISTS idx_key_results_company_okr ON public.key_results(company_okr_id);
CREATE INDEX IF NOT EXISTS idx_key_results_kr_type ON public.key_results(kr_type);
