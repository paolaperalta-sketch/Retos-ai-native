-- 1. Eliminar profile huérfano (user_id no existe en auth.users)
DELETE FROM public.profiles
WHERE email = 'leonardo@bia.app'
  AND user_id = '8dff25dd-3964-4ecd-8389-1fb3014cbc0e';

-- 2. Tabla de roles pendientes por email
CREATE TABLE IF NOT EXISTS public.pending_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);

ALTER TABLE public.pending_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage pending roles"
ON public.pending_user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3. Función trigger: al crear un profile, aplicar rol pendiente si existe
CREATE OR REPLACE FUNCTION public.apply_pending_role_for_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role app_role;
BEGIN
  SELECT role INTO v_role
  FROM public.pending_user_roles
  WHERE lower(email) = lower(NEW.email)
    AND applied_at IS NULL
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, v_role)
    ON CONFLICT DO NOTHING;

    UPDATE public.pending_user_roles
    SET applied_at = now()
    WHERE lower(email) = lower(NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_pending_role ON public.profiles;
CREATE TRIGGER trg_apply_pending_role
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.apply_pending_role_for_new_profile();

-- 4. Pre-asignar super_admin a Leonardo
INSERT INTO public.pending_user_roles (email, role)
VALUES ('leonardo@bia.app', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, applied_at = NULL;