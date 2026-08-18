-- QB SalesRep list -> staging table, plus the user<->rep link column.
-- SalesRep is a QuickBooks LIST object (pull-only here). Each SalesRepRet carries
-- ListID/EditSequence, an Initial (the short code stamped on transactions), and a
-- SalesRepEntityRef pointing at the underlying Employee/Vendor/OtherName.
-- Follows naming convention: {tablename}_id primary keys.

-- ---------------------------------------------------------------------------
-- public.qb_sales_rep
DROP TABLE IF EXISTS public.qb_sales_rep CASCADE;
CREATE TABLE IF NOT EXISTS public.qb_sales_rep (
  qb_sales_rep_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id text NOT NULL,
  edit_sequence text,
  initial text,                 -- SalesRep Initial, e.g. "BW" (unique code in QB)
  name text,                    -- SalesRepEntityRef FullName (linked entity)
  entity_list_id text,          -- SalesRepEntityRef ListID (Employee/Vendor/OtherName)
  is_active boolean,
  time_modified timestamp without time zone,
  raw jsonb,
  synced_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT qb_sales_rep_list_id_key UNIQUE (list_id)
) TABLESPACE pg_default;

ALTER TABLE public.qb_sales_rep OWNER TO postgres;
GRANT ALL ON TABLE public.qb_sales_rep TO anon, authenticated, postgres, service_role;

-- ---------------------------------------------------------------------------
-- Link: each user (rep) may point at one QB SalesRep. ON DELETE SET NULL so a
-- re-sync that drops a rep never blocks; the user simply becomes unlinked.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS qb_sales_rep_id bigint;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_qb_sales_rep_id_fkey;
ALTER TABLE public.users
  ADD CONSTRAINT users_qb_sales_rep_id_fkey
  FOREIGN KEY (qb_sales_rep_id)
  REFERENCES public.qb_sales_rep (qb_sales_rep_id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_qb_sales_rep_id_idx
  ON public.users (qb_sales_rep_id);
