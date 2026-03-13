-- Migration: Add unique constraint to prevent duplicate meter readings
-- Prevents the same reading (same meter + element + timestamp) from being inserted twice
-- This handles cases where the sync client retries an upload that already succeeded.
--
-- IMPORTANT: This is a PARTIAL index (WHERE meter_element_id IS NOT NULL).
-- The ON CONFLICT clause in sync.ts must include the same WHERE predicate:
--   ON CONFLICT (tenant_id, meter_id, meter_element_id, created_at) WHERE meter_element_id IS NOT NULL DO NOTHING
-- Without the WHERE predicate in ON CONFLICT, PostgreSQL throws error 42P10.

CREATE UNIQUE INDEX IF NOT EXISTS uq_meter_reading_dedup
  ON public.meter_reading (tenant_id, meter_id, meter_element_id, created_at)
  WHERE meter_element_id IS NOT NULL;
