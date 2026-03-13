-- Add meter_element_id to notification_rule_meter so rules target (meter, element) pairs
-- Matches the same (meter_id, meter_element_id) keying used throughout the rest of the system

ALTER TABLE public.notification_rule_meter
  ADD COLUMN IF NOT EXISTS meter_element_id bigint NULL;

-- Drop old unique constraint and replace with one that includes element
ALTER TABLE public.notification_rule_meter
  DROP CONSTRAINT IF EXISTS notification_rule_meter_rule_meter_unique;

ALTER TABLE public.notification_rule_meter
  ADD CONSTRAINT notification_rule_meter_rule_meter_element_unique
    UNIQUE (notification_rule_id, meter_id, meter_element_id);

CREATE INDEX IF NOT EXISTS idx_notification_rule_meter_element_id
  ON public.notification_rule_meter(meter_element_id);
