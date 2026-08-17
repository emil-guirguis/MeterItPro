-- Migration: Rename meter_reading table columns to standardized names
-- Purpose: Update meter reading column names for consistency with new naming convention
-- Database: Remote Database (Client API)
-- Date: 2026-03-26

-- Energy columns
ALTER TABLE meter_reading RENAME COLUMN active_energy          TO kwh;
ALTER TABLE meter_reading RENAME COLUMN active_energy_export   TO mwh;

-- Apparent energy columns
ALTER TABLE meter_reading RENAME COLUMN apparent_energy        TO kvah;
ALTER TABLE meter_reading RENAME COLUMN apparent_energy_export TO kvah_export;

-- Apparent power columns
ALTER TABLE meter_reading RENAME COLUMN apparent_power         TO kva;
ALTER TABLE meter_reading RENAME COLUMN apparent_power_phase_a TO phase_kva_a;
ALTER TABLE meter_reading RENAME COLUMN apparent_power_phase_b TO phase_kva_b;
ALTER TABLE meter_reading RENAME COLUMN apparent_power_phase_c TO phase_kva_c;

-- Current columns
ALTER TABLE meter_reading RENAME COLUMN current                TO amperage;
ALTER TABLE meter_reading RENAME COLUMN current_line_a         TO phase_amperage_a;
ALTER TABLE meter_reading RENAME COLUMN current_line_b         TO phase_amperage_b;
ALTER TABLE meter_reading RENAME COLUMN current_line_c         TO phase_amperage_c;

-- Power demand columns
ALTER TABLE meter_reading RENAME COLUMN maximum_demand_real    TO peak_kw;

-- Active power columns
ALTER TABLE meter_reading RENAME COLUMN power                  TO kw;
ALTER TABLE meter_reading RENAME COLUMN power_phase_a          TO phase_kw_a;
ALTER TABLE meter_reading RENAME COLUMN power_phase_b          TO phase_kw_b;
ALTER TABLE meter_reading RENAME COLUMN power_phase_c          TO phase_kw_c;

-- Power factor columns
ALTER TABLE meter_reading RENAME COLUMN power_factor           TO pf;
ALTER TABLE meter_reading RENAME COLUMN power_factor_phase_a   TO pf_a;
ALTER TABLE meter_reading RENAME COLUMN power_factor_phase_b   TO pf_b;
ALTER TABLE meter_reading RENAME COLUMN power_factor_phase_c   TO pf_c;

-- Reactive power columns
ALTER TABLE meter_reading RENAME COLUMN reactive_energy        TO kvarh;
ALTER TABLE meter_reading RENAME COLUMN reactive_power         TO kvar;
ALTER TABLE meter_reading RENAME COLUMN reactive_power_phase_a TO phase_kvar_a;
ALTER TABLE meter_reading RENAME COLUMN reactive_power_phase_b TO phase_kvar_b;
ALTER TABLE meter_reading RENAME COLUMN reactive_power_phase_c TO phase_kvar_c;

-- Voltage THD columns
ALTER TABLE meter_reading RENAME COLUMN voltage_thd            TO total_thdv;
ALTER TABLE meter_reading RENAME COLUMN voltage_thd_phase_a    TO phase_thdv_a;
ALTER TABLE meter_reading RENAME COLUMN voltage_thd_phase_b    TO phase_thdv_b;
ALTER TABLE meter_reading RENAME COLUMN voltage_thd_phase_c    TO phase_thdv_c;
