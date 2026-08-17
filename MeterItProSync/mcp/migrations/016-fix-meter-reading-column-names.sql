-- Fix meter_reading column names to match register table field_name values

-- Rename power_factor back from pf to power_factor to match register field_name
ALTER TABLE meter_reading RENAME COLUMN pf TO power_factor;
