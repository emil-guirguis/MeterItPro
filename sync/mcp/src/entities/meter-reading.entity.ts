/**
 * MeterReading entity representing a meter reading/measurement
 * Database table: meter_reading
 * Primary key: meter_reading_id
 * Tenant filtered: Yes
 */
export type MeterReadingEntity = {
  meter_reading_id?: string;
  meter_id?: number;
  name?: string;
  created_at?: Date;
  timestamp?: Date;
  data_point?: string;
  value?: number;
  unit?: string;
  is_synchronized: boolean;
  retry_count: number;
  kwh?: number;
  mwh?: number;
  kvah?: number;
  kvah_export?: number;
  kva?: number;
  phase_kva_a?: number;
  phase_kva_b?: number;
  phase_kva_c?: number;
  amperage?: number;
  phase_amperage_a?: number;
  phase_amperage_b?: number;
  phase_amperage_c?: number;
  frequency?: number;
  peak_kw?: number;
  kw?: number;
  power_factor?: number;
  pf_a?: number;
  pf_b?: number;
  pf_c?: number;
  phase_kw_a?: number;
  phase_kw_b?: number;
  phase_kw_c?: number;
  kvarh?: number;
  reactive_energy_export?: number;
  kvar?: number;
  phase_kvar_a?: number;
  phase_kvar_b?: number;
  phase_kvar_c?: number;
  voltage_a_b?: number;
  voltage_a_n?: number;
  voltage_b_c?: number;
  voltage_b_n?: number;
  voltage_c_a?: number;
  voltage_c_n?: number;
  voltage_p_n?: number;
  voltage_p_p?: number;
  total_thdv?: number;
  phase_thdv_a?: number;
  phase_thdv_b?: number;
  phase_thdv_c?: number;
  meter_element_id?: number;
  tenant_id?: number;
  sync_status?: string;
  calculated_kwh?: number | null;
};
