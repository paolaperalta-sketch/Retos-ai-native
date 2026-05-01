-- Helper: extract first name + first surname from a full_name, ignoring middle names.
-- Examples:
--   'PAOLA ANDREA PERALTA VARGAS' -> {PAOLA, PERALTA}
--   'KAREN VILLAMIL'              -> {KAREN, VILLAMIL}
--   'MARIA LUCIA VELASCO'         -> {MARIA, VELASCO}
CREATE OR REPLACE FUNCTION public.name_match_tokens(_full_name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  WITH parts AS (
    SELECT regexp_split_to_array(upper(trim(_full_name)), '\s+') AS arr
  )
  SELECT CASE
    WHEN array_length(arr, 1) IS NULL OR array_length(arr, 1) = 0 THEN ARRAY[]::text[]
    WHEN array_length(arr, 1) = 1 THEN ARRAY[arr[1]]
    WHEN array_length(arr, 1) = 2 THEN ARRAY[arr[1], arr[2]]
    -- 3 tokens: first + last (skip middle name)
    WHEN array_length(arr, 1) = 3 THEN ARRAY[arr[1], arr[3]]
    -- 4+ tokens: first name + 3rd token (typical first surname after middle name)
    ELSE ARRAY[arr[1], arr[3]]
  END
  FROM parts;
$$;

-- Replace the RLS policy with a smarter match that skips middle names.
DROP POLICY IF EXISTS "Users read shared KRs by full name" ON public.key_results;

CREATE POLICY "Users read shared KRs by full name"
ON public.key_results
FOR SELECT
TO authenticated
USING (
  assigned_full_name IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles p,
         LATERAL public.name_match_tokens(p.full_name) AS toks
    WHERE p.user_id = auth.uid()
      AND p.full_name IS NOT NULL
      AND array_length(toks, 1) >= 2
      AND POSITION(toks[1] IN upper(key_results.assigned_full_name)) > 0
      AND POSITION(toks[2] IN upper(key_results.assigned_full_name)) > 0
  )
);