-- Migration: Add unique constraint to prevent duplicate meter readings
-- Prevents the same reading (same meter + element + timestamp) from being inserted twice
-- This handles cases where the sync client retries an upload that already succeeded.
--
-- Note: PostgreSQL treats NULL as distinct in unique constraints, so rows where
-- meter_element_id IS NULL will not be deduplicated by this constraint.
-- In practice, meter_element_id is always set for BACnet readings.

CREATE UNIQUE INDEX IF NOT EXISTS uq_meter_reading_dedup
  ON public.meter_reading (tenant_id, meter_id, meter_element_id, created_at)
  WHERE meter_element_id IS NOT NULL;
