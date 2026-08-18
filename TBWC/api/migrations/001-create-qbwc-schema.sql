-- QuickBooks Web Connector (QBWC) Schema
-- Session persistence across Cloudflare Worker isolates, TBWC<->QuickBooks object
-- mapping, and a staging table for pulled Customers.
-- Follows naming convention: {tablename}_id primary keys.

-- Table: public.qbwc_session
-- One row per active Web Connector session. The ticket (uuid) issued by
-- authenticate() is the primary key; QBWC echoes it on every follow-up request.
-- `queue` holds the ordered qbXML request bodies still to send; `cursor` is the
-- index of the next one. Rows are deleted on closeConnection and reaped by age.
DROP TABLE IF EXISTS public.qbwc_session CASCADE;
CREATE TABLE IF NOT EXISTS public.qbwc_session (
  qbwc_session_id uuid NOT NULL,
  company_file text NOT NULL DEFAULT '',
  queue jsonb NOT NULL DEFAULT '[]'::jsonb,
  cursor integer NOT NULL DEFAULT 0,
  last_error text NOT NULL DEFAULT '',
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qbwc_session_pkey PRIMARY KEY (qbwc_session_id)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.qbwc_session OWNER to postgres;
GRANT ALL ON TABLE public.qbwc_session TO anon;
GRANT ALL ON TABLE public.qbwc_session TO authenticated;
GRANT ALL ON TABLE public.qbwc_session TO postgres;
GRANT ALL ON TABLE public.qbwc_session TO service_role;

-- Table: public.qbwc_map
-- Links a TBWC record to its QuickBooks object. QB identifies list objects by
-- ListID and transactions by TxnID (both stored in qb_list_id) and guards edits
-- with EditSequence (optimistic concurrency — required on *ModRq). tbwc_id is
-- null until a locally-created record has been pushed and assigned a QB id.
DROP TABLE IF EXISTS public.qbwc_map CASCADE;
CREATE TABLE IF NOT EXISTS public.qbwc_map (
  qbwc_map_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  object_type character varying(40) NOT NULL,   -- 'Customer','Invoice','Item','Vendor','Bill','Payment',...
  tbwc_id text,                                 -- local record id (nullable until pushed)
  qb_list_id text,                              -- QB ListID or TxnID
  qb_edit_sequence text,                        -- for optimistic *ModRq
  last_synced_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qbwc_map_pkey PRIMARY KEY (qbwc_map_id),
  CONSTRAINT qbwc_map_object_qbid_key UNIQUE (object_type, qb_list_id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS qbwc_map_object_tbwc_idx ON public.qbwc_map (object_type, tbwc_id);

ALTER TABLE IF EXISTS public.qbwc_map OWNER to postgres;
GRANT ALL ON TABLE public.qbwc_map TO anon;
GRANT ALL ON TABLE public.qbwc_map TO authenticated;
GRANT ALL ON TABLE public.qbwc_map TO postgres;
GRANT ALL ON TABLE public.qbwc_map TO service_role;

-- Table: public.qb_customer
-- Staging mirror of QuickBooks Customers pulled via CustomerQueryRq. Decoupled
-- from TBWC business tables so the pull path never assumes a mapping — downstream
-- code joins qb_customer -> qbwc_map -> whatever TBWC table it belongs to.
DROP TABLE IF EXISTS public.qb_customer CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_customer (
  qb_customer_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  list_id text NOT NULL,                         -- QB ListID
  edit_sequence text,
  full_name text,                                -- QB FullName (parent:child)
  name text,
  company_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  bill_addr jsonb,
  is_active boolean,
  balance numeric(15,2),
  time_modified timestamp without time zone,      -- QB TimeModified
  raw jsonb,                                       -- full parsed CustomerRet for auditing
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_customer_pkey PRIMARY KEY (qb_customer_id),
  CONSTRAINT qb_customer_list_id_key UNIQUE (list_id)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.qb_customer OWNER to postgres;
GRANT ALL ON TABLE public.qb_customer TO anon;
GRANT ALL ON TABLE public.qb_customer TO authenticated;
GRANT ALL ON TABLE public.qb_customer TO postgres;
GRANT ALL ON TABLE public.qb_customer TO service_role;
