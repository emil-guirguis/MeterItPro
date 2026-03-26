-- Migration: Update register field_name values to match new meter_reading column names
-- Purpose: Ensure field_name in register table matches renamed database columns
-- Database: Remote Database (Client API)
-- Date: 2026-03-26

-- Update energy field names
UPDATE register SET field_name = 'kwh' WHERE field_name = 'active_energy';
UPDATE register SET field_name = 'mwh' WHERE field_name = 'active_energy_export';
UPDATE register SET field_name = 'kvah' WHERE field_name = 'apparent_energy';
UPDATE register SET field_name = 'kvah_export' WHERE field_name = 'apparent_energy_export';
UPDATE register SET field_name = 'kvarh' WHERE field_name = 'reactive_energy';
UPDATE register SET field_name = 'kvarh_export' WHERE field_name = 'reactive_energy_export';

-- Update power field names
UPDATE register SET field_name = 'kw' WHERE field_name = 'power';
UPDATE register SET field_name = 'kva' WHERE field_name = 'apparent_power';
UPDATE register SET field_name = 'kvar' WHERE field_name = 'reactive_power';

-- Update phase power field names
UPDATE register SET field_name = 'phase_kw_a' WHERE field_name = 'power_phase_a';
UPDATE register SET field_name = 'phase_kw_b' WHERE field_name = 'power_phase_b';
UPDATE register SET field_name = 'phase_kw_c' WHERE field_name = 'power_phase_c';

UPDATE register SET field_name = 'phase_kva_a' WHERE field_name = 'apparent_power_phase_a';
UPDATE register SET field_name = 'phase_kva_b' WHERE field_name = 'apparent_power_phase_b';
UPDATE register SET field_name = 'phase_kva_c' WHERE field_name = 'apparent_power_phase_c';

UPDATE register SET field_name = 'phase_kvar_a' WHERE field_name = 'reactive_power_phase_a';
UPDATE register SET field_name = 'phase_kvar_b' WHERE field_name = 'reactive_power_phase_b';
UPDATE register SET field_name = 'phase_kvar_c' WHERE field_name = 'reactive_power_phase_c';

-- Update current field names
UPDATE register SET field_name = 'amperage' WHERE field_name = 'current';
UPDATE register SET field_name = 'phase_amperage_a' WHERE field_name = 'current_line_a';
UPDATE register SET field_name = 'phase_amperage_b' WHERE field_name = 'current_line_b';
UPDATE register SET field_name = 'phase_amperage_c' WHERE field_name = 'current_line_c';

-- Update power factor field names
UPDATE register SET field_name = 'pf' WHERE field_name = 'power_factor';
UPDATE register SET field_name = 'pf_a' WHERE field_name = 'power_factor_phase_a';
UPDATE register SET field_name = 'pf_b' WHERE field_name = 'power_factor_phase_b';
UPDATE register SET field_name = 'pf_c' WHERE field_name = 'power_factor_phase_c';

-- Update demand field names
UPDATE register SET field_name = 'peak_kw' WHERE field_name = 'maximum_demand_real';

-- Update THD field names
UPDATE register SET field_name = 'total_thdv' WHERE field_name = 'voltage_thd';
UPDATE register SET field_name = 'phase_thdv_a' WHERE field_name = 'voltage_thd_phase_a';
UPDATE register SET field_name = 'phase_thdv_b' WHERE field_name = 'voltage_thd_phase_b';
UPDATE register SET field_name = 'phase_thdv_c' WHERE field_name = 'voltage_thd_phase_c';
