-- tunnel_url is populated at provision time, not at insert.
-- Make it nullable with empty default so creating a sync server doesn't violate NOT NULL.
ALTER TABLE public.sync_server
  ALTER COLUMN tunnel_url DROP NOT NULL,
  ALTER COLUMN tunnel_url SET DEFAULT '';
