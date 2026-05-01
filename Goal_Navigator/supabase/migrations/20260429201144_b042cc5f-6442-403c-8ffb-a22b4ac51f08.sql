
-- 1) Re-vincular profiles existentes al auth.uid() real (mismatch de IDs)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.user_id AS old_id, au.id AS new_id
    FROM public.profiles p
    JOIN auth.users au ON lower(au.email) = lower(p.email)
    WHERE p.user_id <> au.id
      AND p.deleted_at IS NULL
  LOOP
    -- Borrar cualquier stub que pudiera existir en el id nuevo
    DELETE FROM public.profiles WHERE user_id = r.new_id;
    -- Re-apuntar profile + datos relacionados
    UPDATE public.profiles         SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE public.key_results      SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE public.operational_tasks SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE public.user_roles       SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE public.kr_accountability SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE public.monthly_checkins SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE public.academy_progress SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE public.performance_history SET user_id = r.new_id WHERE user_id = r.old_id;
  END LOOP;
END $$;

-- 2) Función para auto-crear profile desde users_master
CREATE OR REPLACE FUNCTION public.auto_create_profile_from_master(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_master record;
BEGIN
  -- Obtener email del auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = _user_id;
  IF v_email IS NULL THEN RETURN false; END IF;

  -- Si ya existe profile, no hacer nada
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND deleted_at IS NULL) THEN
    RETURN true;
  END IF;

  -- Buscar en users_master
  SELECT * INTO v_master
  FROM public.users_master
  WHERE lower(email) = lower(v_email)
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_master IS NULL THEN RETURN false; END IF;

  -- Crear profile con los datos de users_master
  INSERT INTO public.profiles (
    user_id, email, full_name, area, subarea, cargo, contribucion, manager_email
  ) VALUES (
    _user_id,
    v_email,
    v_master.full_name,
    v_master.area,
    v_master.subarea,
    v_master.cargo,
    v_master.contribucion,
    v_master.manager_email
  )
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_create_profile_from_master(uuid) TO authenticated;
