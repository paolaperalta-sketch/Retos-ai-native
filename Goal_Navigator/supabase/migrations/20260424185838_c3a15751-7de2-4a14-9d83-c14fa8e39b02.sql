-- Enable realtime for monthly_checkins so collaborators see leader adjustments live
ALTER TABLE public.monthly_checkins REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'monthly_checkins'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_checkins';
  END IF;
END$$;