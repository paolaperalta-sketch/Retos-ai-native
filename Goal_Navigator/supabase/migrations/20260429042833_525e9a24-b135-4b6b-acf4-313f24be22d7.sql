ALTER TABLE public.company_okrs
  ADD COLUMN IF NOT EXISTS okr_owner_email text,
  ADD COLUMN IF NOT EXISTS okr_owner_full_name text;

CREATE INDEX IF NOT EXISTS idx_company_okrs_owner_email ON public.company_okrs (lower(okr_owner_email));