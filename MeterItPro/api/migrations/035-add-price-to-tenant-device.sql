ALTER TABLE public.tenant_device
  ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0;
11