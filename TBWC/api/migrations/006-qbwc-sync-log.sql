-- QBWC sync run log.
-- One row per qbXML *Rs block processed during a Web Connector session (a single
-- response payload can carry several Rs blocks, e.g. VendorQueryRs + VendorAddRs).
-- Powers the QB Sync dashboard: what synced, which direction, how many rows, when,
-- and any QB-reported error. Written best-effort by the Worker; never blocks sync.
-- Follows naming convention: {tablename}_id primary keys.

CREATE TABLE IF NOT EXISTS public.qbwc_sync_run (
  qbwc_sync_run_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  ticket uuid,                                   -- QBWC session ticket (null for connection-level errors)
  object_type character varying(40) NOT NULL,    -- 'Customer','Vendor','Invoice',... or 'Connection'
  direction character varying(8) NOT NULL,       -- 'pull' (QueryRs) | 'push' (AddRs/ModRs) | 'error'
  status_code text,                              -- QB statusCode attr ('0' ok, '1' empty result)
  rows_processed integer NOT NULL DEFAULT 0,     -- count of *Ret records in the Rs block
  error text,                                    -- QB statusMessage / hresult message, if any
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qbwc_sync_run_pkey PRIMARY KEY (qbwc_sync_run_id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS qbwc_sync_run_created_idx ON public.qbwc_sync_run (created_at DESC);
CREATE INDEX IF NOT EXISTS qbwc_sync_run_object_idx ON public.qbwc_sync_run (object_type, created_at DESC);

ALTER TABLE IF EXISTS public.qbwc_sync_run OWNER to postgres;
-- Worker connects as postgres (table owner, bypasses RLS); PostgREST roles get no
-- access — the dashboard reads through the Worker's admin-only API, not Supabase REST.
ALTER TABLE public.qbwc_sync_run ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.qbwc_sync_run TO postgres;
GRANT ALL ON TABLE public.qbwc_sync_run TO service_role;
