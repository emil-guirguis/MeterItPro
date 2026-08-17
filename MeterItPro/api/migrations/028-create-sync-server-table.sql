CREATE TABLE public.sync_server (
  sync_server_id serial PRIMARY KEY,
  tenant_id integer NOT NULL REFERENCES public.tenant(tenant_id),
  name varchar(255) NOT NULL,
  tunnel_url varchar(500) NOT NULL,
  timezone varchar(100) NOT NULL DEFAULT 'UTC',
  api_key varchar(500) NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_server_tenant_id ON public.sync_server(tenant_id);
