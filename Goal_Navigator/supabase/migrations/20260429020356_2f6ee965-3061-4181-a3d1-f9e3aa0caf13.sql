-- Soft-delete support on profiles + visibility filter
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles (deleted_at);

-- Mirror on users_master for hard exclusion across the app
ALTER TABLE public.users_master ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_users_master_deleted_at ON public.users_master (deleted_at);
