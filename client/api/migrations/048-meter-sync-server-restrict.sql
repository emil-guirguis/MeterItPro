-- Deleting a sync server while meters are still assigned must fail (backstop for
-- the schema-level deleteRestrictions check). Was ON DELETE SET NULL in 047.
ALTER TABLE public.meter
  DROP CONSTRAINT IF EXISTS meter_sync_server_id_fkey;

ALTER TABLE public.meter
  ADD CONSTRAINT meter_sync_server_id_fkey
    FOREIGN KEY (sync_server_id)
    REFERENCES public.sync_server(sync_server_id) ON DELETE RESTRICT;
