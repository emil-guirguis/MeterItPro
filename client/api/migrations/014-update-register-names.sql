-- Migration: Update register name values to user-friendly display names
-- Purpose: Ensure register.name displays properly in UI for all field_name values
-- Database: Remote Database (Client API)
-- Date: 2026-03-26

-- Energy registers
UPDATE register SET name = 'Energy (kWh)' WHERE field_name = 'kwh';
UPDATE register SET name = 'Export Energy (MWh)' WHERE field_name = 'mwh';
UPDATE register SET name = 'Apparent Energy (kVAh)' WHERE field_name = 'kvah';
UPDATE register SET name = 'Export Apparent Energy (kVAh)' WHERE field_name = 'kvah_export';
UPDATE register SET name = 'Reactive Energy (kVArh)' WHERE field_name = 'kvarh';
UPDATE register SET name = 'Export Reactive Energy (kVArh)' WHERE field_name = 'kvarh_export';

-- Power registers
UPDATE register SET name = 'Power (kW)' WHERE field_name = 'kw';
UPDATE register SET name = 'Apparent Power (kVA)' WHERE field_name = 'kva';
UPDATE register SET name = 'Reactive Power (kVAr)' WHERE field_name = 'kvar';
UPDATE register SET name = 'Peak Power (kW)' WHERE field_name = 'peak_kw';

-- Phase power registers
UPDATE register SET name = 'Phase A Power (kW)' WHERE field_name = 'phase_kw_a';
UPDATE register SET name = 'Phase B Power (kW)' WHERE field_name = 'phase_kw_b';
UPDATE register SET name = 'Phase C Power (kW)' WHERE field_name = 'phase_kw_c';
UPDATE register SET name = 'Phase A Apparent Power (kVA)' WHERE field_name = 'phase_kva_a';
UPDATE register SET name = 'Phase B Apparent Power (kVA)' WHERE field_name = 'phase_kva_b';
UPDATE register SET name = 'Phase C Apparent Power (kVA)' WHERE field_name = 'phase_kva_c';
UPDATE register SET name = 'Phase A Reactive Power (kVAr)' WHERE field_name = 'phase_kvar_a';
UPDATE register SET name = 'Phase B Reactive Power (kVAr)' WHERE field_name = 'phase_kvar_b';
UPDATE register SET name = 'Phase C Reactive Power (kVAr)' WHERE field_name = 'phase_kvar_c';

-- Current registers
UPDATE register SET name = 'Current (A)' WHERE field_name = 'amperage';
UPDATE register SET name = 'Phase A Current (A)' WHERE field_name = 'phase_amperage_a';
UPDATE register SET name = 'Phase B Current (A)' WHERE field_name = 'phase_amperage_b';
UPDATE register SET name = 'Phase C Current (A)' WHERE field_name = 'phase_amperage_c';

-- Power factor registers
UPDATE register SET name = 'Power Factor' WHERE field_name = 'pf';
UPDATE register SET name = 'Power Factor Phase A' WHERE field_name = 'pf_a';
UPDATE register SET name = 'Power Factor Phase B' WHERE field_name = 'pf_b';
UPDATE register SET name = 'Power Factor Phase C' WHERE field_name = 'pf_c';

-- Voltage registers (keep existing but ensure consistency)
UPDATE register SET name = 'Voltage A-N (V)' WHERE field_name = 'voltage_a_n';
UPDATE register SET name = 'Voltage B-N (V)' WHERE field_name = 'voltage_b_n';
UPDATE register SET name = 'Voltage C-N (V)' WHERE field_name = 'voltage_c_n';
UPDATE register SET name = 'Voltage Phase-Neutral (V)' WHERE field_name = 'voltage_p_n';
UPDATE register SET name = 'Voltage A-B (V)' WHERE field_name = 'voltage_a_b';
UPDATE register SET name = 'Voltage B-C (V)' WHERE field_name = 'voltage_b_c';
UPDATE register SET name = 'Voltage C-A (V)' WHERE field_name = 'voltage_c_a';
UPDATE register SET name = 'Voltage Phase-Phase (V)' WHERE field_name = 'voltage_p_p';

-- THD registers
UPDATE register SET name = 'Total THD Voltage (%)' WHERE field_name = 'total_thdv';
UPDATE register SET name = 'Phase A THD Voltage (%)' WHERE field_name = 'phase_thdv_a';
UPDATE register SET name = 'Phase B THD Voltage (%)' WHERE field_name = 'phase_thdv_b';
UPDATE register SET name = 'Phase C THD Voltage (%)' WHERE field_name = 'phase_thdv_c';

-- Other registers
UPDATE register SET name = 'Frequency (Hz)' WHERE field_name = 'frequency';
