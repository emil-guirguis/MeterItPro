-- Add report settings columns and rename schedule -> cron

-- Rename schedule -> cron (the schema uses 'cron' as the dbField)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'report' AND column_name = 'schedule'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'report' AND column_name = 'cron'
  ) THEN
    ALTER TABLE public.report RENAME COLUMN schedule TO cron;
  END IF;
END $$;

-- Ensure cron column exists with correct type
ALTER TABLE public.report
  ADD COLUMN IF NOT EXISTS cron character varying(255) NOT NULL DEFAULT '0 9 * * *';

-- Time frame (today, weekly, monthly, yearly, custom)
ALTER TABLE public.report
  ADD COLUMN IF NOT EXISTS time_frame character varying(50) NULL DEFAULT 'monthly';

-- Visualization type (bar, line, pie, csv)
ALTER TABLE public.report
  ADD COLUMN IF NOT EXISTS visualization_type character varying(50) NULL DEFAULT 'bar';

-- Grouping type (hourly, daily, weekly, monthly)
ALTER TABLE public.report
  ADD COLUMN IF NOT EXISTS grouping_type character varying(50) NULL DEFAULT 'daily';

-- Attach as (html, pdf, csv)
ALTER TABLE public.report
  ADD COLUMN IF NOT EXISTS attach_as character varying(50) NULL DEFAULT 'html';
