ALTER TABLE public.sync_server
  ADD COLUMN IF NOT EXISTS location_id integer,
  ADD COLUMN IF NOT EXISTS notes       text NOT NULL DEFAULT '';

-- Add FK once location table PK is confirmed
-- ALTER TABLE public.sync_server ADD CONSTRAINT fk_sync_server_location
--   FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON DELETE SET NULL;