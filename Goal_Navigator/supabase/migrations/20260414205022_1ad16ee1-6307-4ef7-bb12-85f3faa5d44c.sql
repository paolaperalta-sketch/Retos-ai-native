
-- Create users_master table
CREATE TABLE public.users_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  cargo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  area TEXT NOT NULL DEFAULT 'TRANSVERSAL',
  subarea TEXT,
  rol TEXT NOT NULL DEFAULT 'Individual' CHECK (rol IN ('Super Admin', 'Admin', 'Líder', 'Individual')),
  contribucion TEXT NOT NULL DEFAULT 'CONTRIBUIDOR INDIVIDUAL',
  manager_email TEXT,
  hire_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users_master ENABLE ROW LEVEL SECURITY;

-- Helper: check if a user is a manager (direct or indirect) of a target email
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager_email TEXT, _target_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE chain AS (
    SELECT email, manager_email FROM public.users_master WHERE email = _target_email
    UNION ALL
    SELECT um.email, um.manager_email
    FROM public.users_master um
    INNER JOIN chain c ON um.email = c.manager_email
    WHERE um.email != _manager_email
  )
  SELECT EXISTS (
    SELECT 1 FROM chain WHERE manager_email = _manager_email
  )
$$;

-- RLS: Super admins see everything
CREATE POLICY "Super admins full access on users_master"
  ON public.users_master FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: Global leaders (Admins) see their area
CREATE POLICY "Admins read own area users_master"
  ON public.users_master FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'global_leader'::app_role)
    AND area = public.get_user_area(auth.uid())
  );

-- RLS: Team leaders see their reports (recursive)
CREATE POLICY "Leaders read their reports users_master"
  ON public.users_master FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'team_leader'::app_role)
    AND public.is_manager_of(public.get_user_email(auth.uid()), email)
  );

-- RLS: Everyone can read their own record
CREATE POLICY "Users read own record users_master"
  ON public.users_master FOR SELECT
  TO authenticated
  USING (email = public.get_user_email(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_users_master_updated_at
  BEFORE UPDATE ON public.users_master
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for hierarchy lookups
CREATE INDEX idx_users_master_manager ON public.users_master(manager_email);
CREATE INDEX idx_users_master_area ON public.users_master(area);
CREATE INDEX idx_users_master_email ON public.users_master(email);
