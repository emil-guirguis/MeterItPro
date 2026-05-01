-- Add system configuration columns to tenant table

ALTER TABLE public.tenant
  ADD COLUMN IF NOT EXISTS timezone varchar(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS date_format varchar(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS time_format varchar(10) DEFAULT '12h',
  ADD COLUMN IF NOT EXISTS currency varchar(10) DEFAULT '',
  ADD COLUMN IF NOT EXISTS language varchar(10) DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_page_size integer DEFAULT 20;
