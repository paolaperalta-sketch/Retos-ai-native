
CREATE TABLE public.leader_directory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  cargo text NOT NULL,
  area text NOT NULL,
  subarea text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leader_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read leader directory"
  ON public.leader_directory FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage leader directory"
  ON public.leader_directory FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
