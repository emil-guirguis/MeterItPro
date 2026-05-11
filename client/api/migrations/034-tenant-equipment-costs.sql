-- Tenant equipment (devices purchased by tenant) and cost tracking tables

CREATE TABLE IF NOT EXISTS public.tenant_device (
  tenant_device_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  tenant_id         bigint  NOT NULL REFERENCES public.tenant(tenant_id),
  device_id         bigint  NOT NULL,
  quantity          integer NOT NULL DEFAULT 1,
  created_at        timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at        timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tenant_device_pkey   PRIMARY KEY (tenant_device_id),
  CONSTRAINT tenant_device_unique UNIQUE (tenant_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_device_tenant_id ON public.tenant_device(tenant_id);

CREATE TABLE IF NOT EXISTS public.tenant_cost (
  tenant_cost_id  bigint         NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  tenant_id       bigint         NOT NULL REFERENCES public.tenant(tenant_id),
  description     varchar(255)   NOT NULL,
  cost_type       varchar(50)    NOT NULL DEFAULT 'subscription',
  amount          numeric(10,2)  NOT NULL DEFAULT 0,
  billing_cycle   varchar(20)    NOT NULL DEFAULT 'monthly',
  effective_date  date,
  notes           text,
  active          boolean        NOT NULL DEFAULT true,
  created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tenant_cost_pkey PRIMARY KEY (tenant_cost_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_cost_tenant_id ON public.tenant_cost(tenant_id);
