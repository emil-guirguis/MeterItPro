-- api_key replaced by bootstrap_key for server-to-server auth
ALTER TABLE public.sync_server DROP COLUMN IF EXISTS api_key;

-- connection config moved to env vars (CLIENT_API_URL, GITHUB_OWNER, REMOTE_DB_*)
ALTER TABLE public.sync_server
  DROP COLUMN IF EXISTS client_api_url,
  DROP COLUMN IF EXISTS github_owner,
  DROP COLUMN IF EXISTS remote_db_host,
  DROP COLUMN IF EXISTS remote_db_port,
  DROP COLUMN IF EXISTS remote_db_name,
  DROP COLUMN IF EXISTS remote_db_user,
  DROP COLUMN IF EXISTS remote_db_password;
