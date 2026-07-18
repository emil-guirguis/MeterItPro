-- Link each meter to the sync server responsible for reading it.
-- NULL = unassigned; sync servers without an id (legacy) download all tenant meters.
ALTER TABLE public.meter
  ADD COLUMN IF NOT EXISTS sync_server_id INTEGER
    REFERENCES public.sync_server(sync_server_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_meter_sync_server_id ON public.meter(sync_server_id);
