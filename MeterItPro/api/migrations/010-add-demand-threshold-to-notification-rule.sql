-- Add demand_threshold field to notification_rule table
-- Supports the new "demand threshold" notification rule type

ALTER TABLE IF EXISTS public.notification_rule
ADD COLUMN IF NOT EXISTS demand_threshold numeric(10,2) NULL;

-- Comment on the new column
COMMENT ON COLUMN public.notification_rule.demand_threshold IS 'Threshold value for demand-based notifications (kW)';
