-- Add tenant_id to report table so chart queries can be scoped to the correct tenant

ALTER TABLE public.report
  ADD COLUMN IF NOT EXISTS tenant_id bigint NULL REFERENCES public.tenant(tenant_id);
