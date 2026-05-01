
-- Create accountability table for KR self-scoring and leader approval
CREATE TABLE public.kr_accountability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kr_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  suggested_score NUMERIC NOT NULL DEFAULT 0.5,
  self_comment TEXT NOT NULL DEFAULT '',
  progress_value NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  leader_id UUID,
  leader_score NUMERIC,
  leader_comment TEXT,
  period TEXT NOT NULL DEFAULT 'Abril 2026',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kr_accountability ENABLE ROW LEVEL SECURITY;

-- Users can read their own accountability records
CREATE POLICY "Users can read own accountability"
ON public.kr_accountability FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own accountability"
ON public.kr_accountability FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own records (only while pending/submitted)
CREATE POLICY "Users can update own accountability"
ON public.kr_accountability FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Leaders can read their reports' records
CREATE POLICY "Leaders can read reports accountability"
ON public.kr_accountability FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.manager_email = get_user_email(auth.uid())
  )
);

-- Leaders can update their reports' records (approve/adjust)
CREATE POLICY "Leaders can update reports accountability"
ON public.kr_accountability FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'team_leader'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.manager_email = get_user_email(auth.uid())
  )
);

-- Super admins full access
CREATE POLICY "Super admins manage accountability"
ON public.kr_accountability FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Global leaders can read all
CREATE POLICY "Global leaders read all accountability"
ON public.kr_accountability FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'global_leader'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_kr_accountability_updated_at
BEFORE UPDATE ON public.kr_accountability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
