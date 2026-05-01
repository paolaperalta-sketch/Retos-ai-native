INSERT INTO public.okr_pillars (name, sort_order)
SELECT 'PREDICTABLE FINANCE', 10
WHERE NOT EXISTS (SELECT 1 FROM public.okr_pillars WHERE name = 'PREDICTABLE FINANCE');