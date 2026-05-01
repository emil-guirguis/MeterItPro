-- Cloudflare credentials on tenant
ALTER TABLE public.tenant
  ADD COLUMN IF NOT EXISTS cloudflare_account_id varchar(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cloudflare_api_token  varchar(500) NOT NULL DEFAULT '';

-- Tunnel provisioning columns on sync_server
ALTER TABLE public.sync_server
  ADD COLUMN IF NOT EXISTS bootstrap_key    varchar(255),
  ADD COLUMN IF NOT EXISTS tunnel_id        varchar(255),
  ADD COLUMN IF NOT EXISTS tunnel_token     text,
  ADD COLUMN IF NOT EXISTS provision_status varchar(50) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS provision_error  text,
  ADD COLUMN IF NOT EXISTS dns_record_id    varchar(255);

-- Backfill bootstrap_key for any existing rows
UPDATE public.sync_server
  SET bootstrap_key = gen_random_uuid()::text
  WHERE bootstrap_key IS NULL;

ALTER TABLE public.sync_server
  ALTER COLUMN bootstrap_key SET NOT NULL;
