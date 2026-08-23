-- Quotes module: header (public.quote) + line items (public.quote_line).
-- A quote mirrors the "Unit Price | Project BOM" builder: project/customer header
-- plus line items drawn from public.inventory.
-- Follows naming convention: {tablename}_id primary keys.

-- Table: public.quote  (header)
DROP TABLE IF EXISTS public.quote CASCADE;
CREATE TABLE public.quote (
  quote_id       bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  quote_number   text,
  project_name   text,
  customer       text,
  street_address text,
  city_state_zip text,
  poc            text,
  cc_email       text,
  status         text NOT NULL DEFAULT 'draft',   -- draft | sent | won | lost
  rep            text,
  rep_id         uuid,                             -- public.users.id (owning rep)
  notes          text,
  subtotal       numeric(15,2) NOT NULL DEFAULT 0,
  tax            numeric(15,2) NOT NULL DEFAULT 0,
  freight        numeric(15,2) NOT NULL DEFAULT 0,
  total          numeric(15,2) NOT NULL DEFAULT 0,
  created_at     timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at     timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quote_pkey PRIMARY KEY (quote_id)
) TABLESPACE pg_default;

CREATE INDEX quote_rep_id_idx ON public.quote (rep_id);
CREATE INDEX quote_status_idx ON public.quote (status);

ALTER TABLE public.quote OWNER to postgres;
GRANT ALL ON TABLE public.quote TO anon, authenticated, postgres, service_role;

-- Table: public.quote_line  (line items)
-- inventory_id is nullable (custom lines allowed) and ON DELETE SET NULL so a
-- catalog item can be retired without destroying historical quotes; the
-- part_number/description snapshot preserves what was quoted.
DROP TABLE IF EXISTS public.quote_line CASCADE;
CREATE TABLE public.quote_line (
  quote_line_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  quote_id      bigint NOT NULL,
  inventory_id  bigint,
  part_number   text,
  description   text,
  qty           numeric(12,2) NOT NULL DEFAULT 1,
  unit_price    numeric(15,2) NOT NULL DEFAULT 0,
  ext_price     numeric(15,2) NOT NULL DEFAULT 0,
  line_order    integer NOT NULL DEFAULT 0,
  created_at    timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quote_line_pkey PRIMARY KEY (quote_line_id),
  CONSTRAINT quote_line_quote_fkey FOREIGN KEY (quote_id)
    REFERENCES public.quote (quote_id) ON DELETE CASCADE,
  CONSTRAINT quote_line_inventory_fkey FOREIGN KEY (inventory_id)
    REFERENCES public.inventory (inventory_id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE INDEX quote_line_quote_id_idx     ON public.quote_line (quote_id);
CREATE INDEX quote_line_inventory_id_idx ON public.quote_line (inventory_id);

ALTER TABLE public.quote_line OWNER to postgres;
GRANT ALL ON TABLE public.quote_line TO anon, authenticated, postgres, service_role;
