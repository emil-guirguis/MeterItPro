-- Fix aggregation_type column type from jsonb to varchar(20)
-- The column was created as jsonb but should be varchar for string enum values

ALTER TABLE public.dashboard
  ALTER COLUMN aggregation_type TYPE varchar(20) USING aggregation_type::text;
