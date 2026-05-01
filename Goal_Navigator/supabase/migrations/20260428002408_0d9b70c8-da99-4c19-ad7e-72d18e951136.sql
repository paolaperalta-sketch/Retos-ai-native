-- 1. Add closing_month column to key_results with check constraint
ALTER TABLE public.key_results
ADD COLUMN IF NOT EXISTS closing_month TEXT;

-- 2. Drop existing constraint if any (safe re-run)
ALTER TABLE public.key_results
DROP CONSTRAINT IF EXISTS key_results_closing_month_check;

ALTER TABLE public.key_results
ADD CONSTRAINT key_results_closing_month_check
CHECK (closing_month IS NULL OR closing_month IN ('abril', 'mayo', 'junio', 'julio'));

-- 3. Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_kr_closing_month
ON public.key_results (closing_month);

-- 4. Seed: assign 'mayo' to all existing KRs without a month
UPDATE public.key_results
SET closing_month = 'mayo'
WHERE closing_month IS NULL;