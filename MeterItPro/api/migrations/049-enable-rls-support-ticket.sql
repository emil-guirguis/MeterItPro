-- Enable Row-Level Security on public.support_ticket.
-- This table was created in 041-support-site.sql, after 038-enable-rls-all-tables.sql,
-- so it was missed by the blanket enable and PostgREST exposed it without RLS.
-- The Worker connects as the postgres superuser via Hyperdrive, which bypasses RLS.
-- No policies are added: anon/authenticated roles via PostgREST are denied all access.

ALTER TABLE public.support_ticket ENABLE ROW LEVEL SECURITY;
