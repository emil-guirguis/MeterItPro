-- Notification state machine: ack workflow + email dedup.
-- Phase 4 of quality engine work.
--
-- Semantics:
--   status 'open'          = condition active, unacknowledged
--   status 'acknowledged'  = user has seen it; no re-notify emails while acked
--   cleared                = row deleted (unchanged from prior behavior)
--
-- last_notified_at powers email dedup: the runner emails only when NULL
-- (newly opened) or older than the re-notify window, instead of every
-- matching cron tick.

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS status VARCHAR(15) NOT NULL DEFAULT 'open'
    CONSTRAINT notification_status_check CHECK (status IN ('open', 'acknowledged')),
  ADD COLUMN IF NOT EXISTS first_detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by BIGINT;
