
-- Create monthly_checkins table
CREATE TABLE public.monthly_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kr_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  month TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  progress_percent NUMERIC NOT NULL DEFAULT 0,
  status_rating TEXT NOT NULL DEFAULT 'parcial',
  collaborator_comment TEXT NOT NULL DEFAULT '',
  leader_feedback TEXT,
  flow_status TEXT NOT NULL DEFAULT 'draft',
  leader_id UUID,
  leader_adjusted_percent NUMERIC,
  leader_adjusted_rating TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kr_id, user_id, month)
);

-- Enable RLS
ALTER TABLE public.monthly_checkins ENABLE ROW LEVEL SECURITY;

-- Users can read own check-ins
CREATE POLICY "Users can read own checkins"
ON public.monthly_checkins FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert own check-ins
CREATE POLICY "Users can insert own checkins"
ON public.monthly_checkins FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own draft check-ins
CREATE POLICY "Users can update own draft checkins"
ON public.monthly_checkins FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND flow_status = 'draft');

-- Leaders can read reports check-ins
CREATE POLICY "Leaders read reports checkins"
ON public.monthly_checkins FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role) AND
  user_id IN (SELECT p.user_id FROM profiles p WHERE p.manager_email = get_user_email(auth.uid()))
);

-- Leaders can update reports submitted check-ins (approve/adjust)
CREATE POLICY "Leaders update reports checkins"
ON public.monthly_checkins FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role) AND
  user_id IN (SELECT p.user_id FROM profiles p WHERE p.manager_email = get_user_email(auth.uid()))
);

-- Global leaders can read all
CREATE POLICY "Global leaders read all checkins"
ON public.monthly_checkins FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'global_leader'::app_role));

-- Super admins full access
CREATE POLICY "Super admins manage checkins"
ON public.monthly_checkins FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_monthly_checkins_updated_at
BEFORE UPDATE ON public.monthly_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
