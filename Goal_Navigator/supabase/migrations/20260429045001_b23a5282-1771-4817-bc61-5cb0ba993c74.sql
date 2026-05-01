DO $$
DECLARE
  v_canonical uuid := 'cb9c1d80-f702-bd1b-bada-4a0b103d2283';
  v_dup uuid := '6dbcefa9-9fb3-f2e6-b3ba-ae0159aa85bc';
BEGIN
  IF EXISTS (SELECT 1 FROM public.company_okrs WHERE id = v_dup) THEN
    UPDATE public.key_results SET company_okr_id = v_canonical WHERE company_okr_id = v_dup;
    DELETE FROM public.company_okrs WHERE id = v_dup;
  END IF;
  UPDATE public.company_okrs
     SET area = 'TRANSVERSAL',
         description = 'Regla global: cada usuario activo recibe 2 KRs obligatorios AI native (mayo + junio).',
         okr_owner_email = NULL,
         okr_owner_full_name = NULL
   WHERE id = v_canonical;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_ai_native_krs_for_profile(
  _user_id uuid,
  _email text,
  _full_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_okr_id uuid := 'cb9c1d80-f702-bd1b-bada-4a0b103d2283';
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
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.user_id, p.email, p.full_name
      FROM public.profiles p
      JOIN public.users_master um
        ON lower(um.email) = lower(p.email)
       AND um.deleted_at IS NULL
     WHERE p.deleted_at IS NULL
  LOOP
    PERFORM public.ensure_ai_native_krs_for_profile(r.user_id, r.email, r.full_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.trg_assign_ai_native_krs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_ai_native_krs_for_profile(NEW.user_id, NEW.email, NEW.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_assign_ai_native_krs ON public.profiles;
CREATE TRIGGER profiles_assign_ai_native_krs
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_assign_ai_native_krs();