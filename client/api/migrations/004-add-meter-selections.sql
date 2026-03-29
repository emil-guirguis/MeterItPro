-- Add meter_selections and aggregation_type columns

ALTER TABLE IF EXISTS public.dashboard
  ADD COLUMN IF NOT EXISTS meter_selections text NULL;

ALTER TABLE IF EXISTS public.notification_rule
  ADD COLUMN IF NOT EXISTS meter_selections text NULL;

ALTER TABLE IF EXISTS public.report
  ADD COLUMN IF NOT EXISTS meter_selections text NULL;

ALTER TABLE IF EXISTS public.dashboard
  ADD COLUMN IF NOT EXISTS aggregation_type varchar(20) NULL;
