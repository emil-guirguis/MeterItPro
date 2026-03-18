/**
 * MeterReading entity representing a meter reading/measurement
 * Database table: meter_reading
 * Primary key: meter_reading_id
 * Tenant filtered: Yes
 */
export type MeterReadingEntity = {
  meter_reading_id?: string;
  meter_id: number;
  created_at: Date;
  is_synchronized: boolean;
  retry_count: number;
  active_energy?: number;
  active_energy_export?: number;
  apparent_energy?: number;
  apparent_energy_export?: number;
  apparent_power?: number;
  apparent_power_phase_a?: number;
  apparent_power_phase_b?: number;
  apparent_power_phase_c?: number;
  current?: number;
  current_line_a?: number;
  current_line_b?: number;
  current_line_c?: number;
  frequency?: number;
  maximum_demand_real?: number;
  power?: number;
  power_factor?: number;
  power_factor_phase_a?: number;
  power_factor_phase_b?: number;
  power_factor_phase_c?: number;
  power_phase_a?: number;
  power_phase_b?: number;
  power_phase_c?: number;
  reactive_energy?: number;
  reactive_energy_export?: number;
  reactive_power?: number;
  reactive_power_phase_a?: number;
  reactive_power_phase_b?: number;
  reactive_power_phase_c?: number;
  voltage_a_b?: number;
  voltage_a_n?: number;
  voltage_b_c?: number;
  voltage_b_n?: number;
  voltage_c_a?: number;
  voltage_c_n?: number;
  voltage_p_n?: number;
  voltage_p_p?: number;
  voltage_thd?: number;
  voltage_thd_phase_a?: number;
  voltage_thd_phase_b?: number;
  voltage_thd_phase_c?: number;
  meter_element_id?: number;
  tenant_id?: number;
  sync_status?: string;
  calculated_kwh?: number | null;
};
