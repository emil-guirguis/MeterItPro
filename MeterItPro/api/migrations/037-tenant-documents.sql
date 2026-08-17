CREATE TABLE IF NOT EXISTS public.tenant_document (
  tenant_document_id bigint        NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  tenant_id          bigint        NOT NULL REFERENCES public.tenant(tenant_id) ON DELETE CASCADE,
  description        varchar(255)  NOT NULL DEFAULT '',
  file_name          varchar(255)  NOT NULL,
  file_type          varchar(100)  NOT NULL DEFAULT 'application/octet-stream',
  file_size          integer       NOT NULL DEFAULT 0,
  file_data          text          NOT NULL,
  created_at         timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at         timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tenant_document_pkey PRIMARY KEY (tenant_document_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_document_tenant_id ON public.tenant_document(tenant_id);
