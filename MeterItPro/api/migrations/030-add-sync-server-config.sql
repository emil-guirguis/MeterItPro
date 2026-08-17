-- Remote DB connection config per sync server (returned to installer via bootstrap)
ALTER TABLE public.sync_server
  ADD COLUMN IF NOT EXISTS client_api_url     varchar(500) NOT NULL DEFAULT 'https://meteritpro.com/api',
  ADD COLUMN IF NOT EXISTS github_owner       varchar(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS remote_db_host     varchar(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS remote_db_port     integer      NOT NULL DEFAULT 5432,
  ADD COLUMN IF NOT EXISTS remote_db_name     varchar(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS remote_db_user     varchar(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS remote_db_password varchar(500) NOT NULL DEFAULT '';

-- GitHub token on tenant (for docker login ghcr.io, shared across all sync servers)
ALTER TABLE public.tenant
  ADD COLUMN IF NOT EXISTS github_token varchar(500) NOT NULL DEFAULT '';
