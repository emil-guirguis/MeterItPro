-- Atomic upsert support for the notification table.
-- Adds a UNIQUE constraint on (tenant_id, meter_id, meter_element_id, notification_type)
-- using NULLS NOT DISTINCT so rows with NULL meter_id or meter_element_id collapse correctly.
--
-- Side effect: notification_id now stays stable across rule re-runs (UPDATE instead of
-- DELETE + INSERT), so any user-acknowledged or read state on the row will persist
-- instead of resetting on the next cron tick.

-- Step 1: collapse existing duplicates, keeping the most recent row per target.
WITH ranked AS (
  SELECT
    notification_id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, meter_id, meter_element_id, notification_type
      ORDER BY created_at DESC NULLS LAST, notification_id DESC
    ) AS rn
  FROM public.notification
)
DELETE FROM public.notification
WHERE notification_id IN (SELECT notification_id FROM ranked WHERE rn > 1);

-- Step 2: add the unique constraint with NULLS NOT DISTINCT (Postgres 15+).
ALTER TABLE public.notification
  ADD CONSTRAINT notification_unique_target
  UNIQUE NULLS NOT DISTINCT (tenant_id, meter_id, meter_element_id, notification_type);
