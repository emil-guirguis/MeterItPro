-- Diagnostic: find any array-type columns in meter_reading
-- Run this first to confirm which columns are arrays before applying the fix
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'meter_reading'
  AND data_type = 'ARRAY'
ORDER BY column_name;

-- Fix: convert calculated_kwh from array type to NUMERIC(18,4) if needed.
-- The IF NOT EXISTS migration (008) silently skipped this column if it already
-- existed with the wrong type, causing "malformed array literal" errors on upload.
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'meter_reading'
    AND column_name = 'calculated_kwh';

  IF col_type = 'ARRAY' THEN
    RAISE NOTICE 'calculated_kwh is an ARRAY type — converting to NUMERIC(18,4)';
    ALTER TABLE meter_reading
      ALTER COLUMN calculated_kwh TYPE NUMERIC(18,4)
      USING NULL; -- discard any existing array values (they are derived/recalculated)
  ELSE
    RAISE NOTICE 'calculated_kwh type is: % — no change needed', col_type;
  END IF;
END $$;

-- Safety net: fix any other numeric columns that may have been accidentally
-- created as arrays. Add more column names here if the diagnostic above shows others.
-- Example (uncomment and run if diagnostic reveals additional array columns):
-- ALTER TABLE meter_reading ALTER COLUMN power_factor_phase_a TYPE NUMERIC(18,4) USING NULL;
