-- Enable Row-Level Security on every public table still missing it.
-- Migrations 001-005 each GRANT ALL ... TO anon, authenticated with RLS never
-- enabled, so these were fully exposed (read + write) via PostgREST using the
-- public anon key. Verified live against the tbwc-site DB (pg_class.relrowsecurity)
-- on 2026-09-03 — public."order", public.users, public.qbwc_sync_run and
-- public.rep_leads already have RLS on; these thirteen did not.
--
-- The Worker connects as the postgres superuser via Hyperdrive/DATABASE_URL,
-- which bypasses RLS. No policies are added: anon/authenticated roles via
-- PostgREST are denied all access, matching MeterItPro's 038-enable-rls-all-tables.sql.
-- Idempotent (ENABLE RLS on an already-enabled table is a no-op).

ALTER TABLE IF EXISTS public.qbwc_session   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qbwc_map       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_customer    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_vendor      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_item        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_invoice     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_payment     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_sales_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_estimate    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qb_sales_rep   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quote          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quote_line     ENABLE ROW LEVEL SECURITY;
