-- QBWC staging tables for the remaining pulled objects + vendor push.
-- Each mirrors a QuickBooks object; `raw` keeps the parsed *Ret for auditing.
-- Follows naming convention: {tablename}_id primary keys.

-- ---------------------------------------------------------------------------
-- public.qb_vendor  (reps pushed from public.users land back here on VendorQuery)
DROP TABLE IF EXISTS public.qb_vendor CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_vendor (
  qb_vendor_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id text NOT NULL,
  edit_sequence text,
  name text,
  company_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  vendor_addr jsonb,
  is_active boolean,
  balance numeric(15,2),
  time_modified timestamp without time zone,
  raw jsonb,
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_vendor_list_id_key UNIQUE (list_id)
) TABLESPACE pg_default;

-- ---------------------------------------------------------------------------
-- public.qb_item  (product/service list; needed to build invoice lines later)
DROP TABLE IF EXISTS public.qb_item CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_item (
  qb_item_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id text NOT NULL,
  edit_sequence text,
  item_type text,               -- Service, Inventory, NonInventory, ...
  name text,
  full_name text,
  sales_desc text,
  sales_price numeric(15,2),
  is_active boolean,
  time_modified timestamp without time zone,
  raw jsonb,
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_item_list_id_key UNIQUE (list_id)
) TABLESPACE pg_default;

-- ---------------------------------------------------------------------------
-- public.qb_invoice  (transactions keyed by TxnID; lines kept as jsonb)
DROP TABLE IF EXISTS public.qb_invoice CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_invoice (
  qb_invoice_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  txn_id text NOT NULL,
  edit_sequence text,
  ref_number text,
  customer_list_id text,
  customer_name text,
  txn_date date,
  due_date date,
  subtotal numeric(15,2),
  total numeric(15,2),
  balance_remaining numeric(15,2),
  is_paid boolean,
  lines jsonb,
  time_modified timestamp without time zone,
  raw jsonb,
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_invoice_txn_id_key UNIQUE (txn_id)
) TABLESPACE pg_default;

-- ---------------------------------------------------------------------------
-- public.qb_payment  (ReceivePayment)
DROP TABLE IF EXISTS public.qb_payment CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_payment (
  qb_payment_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  txn_id text NOT NULL,
  edit_sequence text,
  ref_number text,
  customer_list_id text,
  customer_name text,
  txn_date date,
  total_amount numeric(15,2),
  time_modified timestamp without time zone,
  raw jsonb,
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_payment_txn_id_key UNIQUE (txn_id)
) TABLESPACE pg_default;

-- ---------------------------------------------------------------------------
-- public.qb_sales_order  (QB Premier/Enterprise only)
DROP TABLE IF EXISTS public.qb_sales_order CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_sales_order (
  qb_sales_order_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  txn_id text NOT NULL,
  edit_sequence text,
  ref_number text,
  customer_list_id text,
  customer_name text,
  txn_date date,
  total numeric(15,2),
  is_fully_invoiced boolean,
  is_manually_closed boolean,
  lines jsonb,
  time_modified timestamp without time zone,
  raw jsonb,
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_sales_order_txn_id_key UNIQUE (txn_id)
) TABLESPACE pg_default;

-- ---------------------------------------------------------------------------
-- public.qb_estimate  (quotes; QB Premier/Enterprise only)
DROP TABLE IF EXISTS public.qb_estimate CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_estimate (
  qb_estimate_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  txn_id text NOT NULL,
  edit_sequence text,
  ref_number text,
  customer_list_id text,
  customer_name text,
  txn_date date,
  total numeric(15,2),
  lines jsonb,
  time_modified timestamp without time zone,
  raw jsonb,
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_estimate_txn_id_key UNIQUE (txn_id)
) TABLESPACE pg_default;

-- Grants for all six (Supabase roles).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['qb_vendor','qb_item','qb_invoice','qb_payment','qb_sales_order','qb_estimate'] LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO postgres', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, postgres, service_role', t);
  END LOOP;
END $$;
