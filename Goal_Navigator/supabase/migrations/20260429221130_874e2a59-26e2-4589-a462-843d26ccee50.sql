-- 1) Update the function to point to the CURRENT AI native company_okr id
CREATE OR REPLACE FUNCTION public.ensure_ai_native_krs_for_profile(_user_id uuid, _email text, _full_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_okr_id uuid := '582824fb-3a89-46fc-9959-fba717cc028a';
  v_kr1_name text := '★ 80% de las tareas operativas recurrentes del rol automatizadas y funcionando al cierre de mayo. Validado por el líder directo. No cuenta por declaración propia.';
  v_kr2_name text := '★ 1 proyecto de AI en producción en la nube de Bia al cierre de junio. Requisitos (los 4 son obligatorios): (1) proceso nombrado, (2) baseline en horas/semana o costo antes, (3) resultado medido después, (4) subido a la nube de Bia — no demo local.';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.key_results
     WHERE company_okr_id = v_company_okr_id
       AND name = v_kr1_name
       AND (user_id = _user_id OR lower(assigned_email) = lower(_email))
  ) THEN
    INSERT INTO public.key_results (
      company_okr_id, user_id, assigned_email, assigned_full_name,
      name, baseline, target, current_value, weight, status,
      frecuencia, kr_type, closing_month, monthly_targets
    ) VALUES (
      v_company_okr_id, _user_id, _email, _full_name,
      v_kr1_name, 0, 100, 0, 0.5, 'on_track',
      'Mensual', 'company', 'mayo',
      jsonb_build_object(
        'baseline', '0%',
        'meta_mayo', '100% automatizadas',
        'meta_junio', '—',
        'meta_julio', '—',
        'active_month', '2026-05'
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.key_results
     WHERE company_okr_id = v_company_okr_id
       AND name = v_kr2_name
       AND (user_id = _user_id OR lower(assigned_email) = lower(_email))
  ) THEN
    INSERT INTO public.key_results (
      company_okr_id, user_id, assigned_email, assigned_full_name,
      name, baseline, target, current_value, weight, status,
      frecuencia, kr_type, closing_month, monthly_targets
    ) VALUES (
      v_company_okr_id, _user_id, _email, _full_name,
      v_kr2_name, 0, 1, 0, 0.5, 'on_track',
      'Mensual', 'company', 'junio',
      jsonb_build_object(
        'baseline', '0',
        'meta_mayo', '—',
        'meta_junio', '1 proyecto en nube + before/after',
        'meta_julio', '—',
        'active_month', '2026-06'
      )
    );
  END IF;
END;
$function$;

-- 2) Trigger on profiles to auto-assign KRs on insert/update
DROP TRIGGER IF EXISTS trg_assign_ai_native_krs_on_profile ON public.profiles;

CREATE TRIGGER trg_assign_ai_native_krs_on_profile
  AFTER INSERT OR UPDATE OF email, full_name ON public.profiles
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION public.trg_assign_ai_native_krs();

-- 3) Backfill: ensure all currently-active profiles have the 2 AI native KRs
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT user_id, email, full_name
      FROM public.profiles
     WHERE deleted_at IS NULL
       AND user_id IS NOT NULL
  LOOP
    PERFORM public.ensure_ai_native_krs_for_profile(r.user_id, r.email, r.full_name);
  END LOOP;
END$$;