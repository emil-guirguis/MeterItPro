-- Add calculated_kwh column to remote meter_reading table
ALTER TABLE meter_reading
  ADD COLUMN IF NOT EXISTS calculated_kwh NUMERIC(18,4) DEFAULT NULL;
