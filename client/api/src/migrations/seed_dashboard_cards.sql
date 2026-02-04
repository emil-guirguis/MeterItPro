-- Seed sample dashboard cards for testing
-- This script creates 2 sample dashboard cards:
-- 1. kWh (Total Energy) card with last_month preset
-- 2. kW Peak card with this_month_to_date preset

-- Get the first available tenant, user, meter, and meter_element for seeding
WITH seed_data AS (
  SELECT 
    t.tenant_id,
    u.users_id,
    m.meter_id,
    me.meter_element_id
  FROM tenant t
  JOIN "users" u ON u.tenant_id = t.tenant_id
  JOIN meter m ON m.tenant_id = t.tenant_id
  JOIN meter_element me ON me.meter_id = m.meter_id
  LIMIT 1
)
INSERT INTO dashboard (
  tenant_id,
  created_by_users_id,
  meter_id,
  meter_element_id,
  card_name,
  card_description,
  selected_columns,
  time_frame_type,
  custom_start_date,
  custom_end_date,
  visualization_type,
  created_at,
  updated_at
)
SELECT
  seed_data.tenant_id,
  seed_data.users_id,
  seed_data.meter_id,
  seed_data.meter_element_id,
  'Monthly Energy Consumption',
  'Total kWh consumed in the last month',
  '["kwh"]'::jsonb,
  'last_month',
  NULL,
  NULL,
  'line',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM seed_data

UNION ALL

SELECT
  seed_data.tenant_id,
  seed_data.users_id,
  seed_data.meter_id,
  seed_data.meter_element_id,
  'Peak Power This Month',
  'Highest kW recorded this month to date',
  '["kw"]'::jsonb,
  'this_month_to_date',
  NULL,
  NULL,
  'bar',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM seed_data;

-- Verify the inserted records
SELECT 
  dashboard_id,
  card_name,
  selected_columns,
  time_frame_type,
  visualization_type,
  created_at
FROM dashboard
ORDER BY dashboard_id DESC
LIMIT 2;
