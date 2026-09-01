-- Re-enable Row-Level Security on the reporting tables and the orphaned
-- notification_settings table.
--
-- 038-enable-rls-all-tables.sql enabled RLS on report, report_history and
-- report_email_logs, but 001-create-reporting-schema.sql DROPs+recreates those
-- three (with RLS off and GRANT ALL TO anon/authenticated) and runs earlier in
-- every replay. A full run-migrations.js replay aborts at the non-idempotent
-- 028 migration before reaching 038, so the reporting tables were left exposed.
-- notification_settings was dropped by 026 but a leftover copy remained.
--
-- The Worker connects as the postgres superuser via Hyperdrive, which bypasses
-- RLS. No policies are added: anon/authenticated roles via PostgREST are denied
-- all access. Idempotent (ENABLE RLS on an already-enabled table is a no-op).

ALTER TABLE IF EXISTS public.report               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.report_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.report_email_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_settings ENABLE ROW LEVEL SECURITY;
