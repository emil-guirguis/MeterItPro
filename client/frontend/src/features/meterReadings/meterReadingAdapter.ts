/**
 * Meter Reading Data Adapter
 * 
 * Transforms raw meter reading data from the API into the format
 * expected by the DetailedMeterReadingView component
 */

interface RawMeterReading {
  // Identifiers
  meter_reading_id?: string;
  meter_id?: number;
  tenant_id?: number;
  meter_element_id?: number;
  created_at?: string;
  
  // Meter info
  meter_name?: string;
  meter_type?: string;
  serial_number?: string;
  meter_ip?: string;
  meter_port?: string;
  meter_protocol?: string;
  meter_notes?: string;
  element_name?: string;
  element_number?: number;
  
  // Energy totals
  active_energy?: number;
  active_energy_export?: number;
  reactive_energy?: number;
  reactive_energy_export?: number;
  apparent_energy?: number;
  apparent_energy_export?: number;
  
  // Phase voltages (line-to-neutral)
  voltage_a_n?: number;
  voltage_b_n?: number;
  voltage_c_n?: number;
  voltage_p_n?: number;
  
  // Line voltages (line-to-line)
  voltage_a_b?: number;
  voltage_b_c?: number;
  voltage_c_a?: number;
  voltage_p_p?: number;
  
  // Current
  current?: number;
  current_line_a?: number;
  current_line_b?: number;
  current_line_c?: number;
  
  // Power
  power?: number;
  power_phase_a?: number;
  power_phase_b?: number;
  power_phase_c?: number;
  
  // Apparent power
  apparent_power?: number;
  apparent_power_phase_a?: number;
  apparent_power_phase_b?: number;
  apparent_power_phase_c?: number;
  
  // Reactive power
  reactive_power?: number;
  reactive_power_phase_a?: number;
  reactive_power_phase_b?: number;
  reactive_power_phase_c?: number;
  
  // Power factor
  power_factor?: number;
  power_factor_phase_a?: number;
  power_factor_phase_b?: number;
  power_factor_phase_c?: number;
  
  // Frequency
  frequency?: number;
  
  // Other
  maximum_demand_real?: number;
  voltage_thd?: number;
  voltage_thd_phase_a?: number;
  voltage_thd_phase_b?: number;
  voltage_thd_phase_c?: number;
}

export interface MeterInfo {
  driver: string;
  description: string;
  serialNumber: string;
}

export interface MeterReadingData {
  // Energy totals
  activeEnergyTotal: number;
  reactiveEnergyTotal: number;
  activeEnergyExport: number;
  reactiveEnergyExport: number;
  
  // Phase voltages (line-to-neutral)
  voltagePhaseA: number;
  voltagePhaseB: number;
  voltagePhaseC: number;
  
  // Line voltages (line-to-line)
  voltageAB: number;
  voltageBC: number;
  voltageCA: number;
  
  // Current per phase
  currentPhaseA: number;
  currentPhaseB: number;
  currentPhaseC: number;
  currentTotal: number;
  
  // Active power
  powerPhaseA: number;
  powerPhaseB: number;
  powerPhaseC: number;
  powerTotal: number;
  
  // Apparent power
  apparentPowerPhaseA: number;
  apparentPowerPhaseB: number;
  apparentPowerPhaseC: number;
  apparentPowerTotal: number;
  
  // Reactive power
  reactivePowerPhaseA: number;
  reactivePowerPhaseB: number;
  reactivePowerPhaseC: number;
  reactivePowerTotal: number;
  
  // Power factor
  powerFactorPhaseA: number;
  powerFactorPhaseB: number;
  powerFactorPhaseC: number;
  powerFactorTotal: number;
  
  // Frequency
  frequency: number;
  
  // Timestamp
  timestamp: Date;
}

/**
 * Helper function to safely convert values to numbers with fallback
 */
const toNumber = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Transform raw meter reading data from API to component format
 */
export function adaptMeterReading(raw: RawMeterReading): {
  meterInfo: MeterInfo;
  reading: MeterReadingData;
} {
  // Extract meter info
  const meterInfo: MeterInfo = {
    driver: raw.meter_type || raw.meter_protocol || 'Unknown Driver',
    description: raw.meter_name || raw.meter_notes || 'No Description',
    serialNumber: raw.serial_number || 'N/A',
  };
  
  // Transform reading data
  // Note: Values are divided by 1000 where appropriate to convert from W to kW, VA to kVA, etc.
  const reading: MeterReadingData = {
    // Energy totals (already in kWh/kVArh from database)
    activeEnergyTotal: toNumber(raw.active_energy, 0),
    reactiveEnergyTotal: toNumber(raw.reactive_energy, 0),
    activeEnergyExport: toNumber(raw.active_energy_export, 0),
    reactiveEnergyExport: toNumber(raw.reactive_energy_export, 0),
    
    // Phase voltages (line-to-neutral) - already in V
    voltagePhaseA: toNumber(raw.voltage_a_n, 0),
    voltagePhaseB: toNumber(raw.voltage_b_n, 0),
    voltagePhaseC: toNumber(raw.voltage_c_n, 0),
    
    // Line voltages (line-to-line) - already in V
    voltageAB: toNumber(raw.voltage_a_b, 0),
    voltageBC: toNumber(raw.voltage_b_c, 0),
    voltageCA: toNumber(raw.voltage_c_a, 0),
    
    // Current per phase - already in A
    currentPhaseA: toNumber(raw.current_line_a, 0),
    currentPhaseB: toNumber(raw.current_line_b, 0),
    currentPhaseC: toNumber(raw.current_line_c, 0),
    currentTotal: toNumber(raw.current, 0),
    
    // Active power - convert to kW if needed (assuming database stores in kW)
    powerPhaseA: toNumber(raw.power_phase_a, 0),
    powerPhaseB: toNumber(raw.power_phase_b, 0),
    powerPhaseC: toNumber(raw.power_phase_c, 0),
    powerTotal: toNumber(raw.power, 0),
    
    // Apparent power - convert to kVA if needed (assuming database stores in kVA)
    apparentPowerPhaseA: toNumber(raw.apparent_power_phase_a, 0),
    apparentPowerPhaseB: toNumber(raw.apparent_power_phase_b, 0),
    apparentPowerPhaseC: toNumber(raw.apparent_power_phase_c, 0),
    apparentPowerTotal: toNumber(raw.apparent_power, 0),
    
    // Reactive power - convert to kVAr if needed (assuming database stores in kVAr)
    reactivePowerPhaseA: toNumber(raw.reactive_power_phase_a, 0),
    reactivePowerPhaseB: toNumber(raw.reactive_power_phase_b, 0),
    reactivePowerPhaseC: toNumber(raw.reactive_power_phase_c, 0),
    reactivePowerTotal: toNumber(raw.reactive_power, 0),
    
    // Power factor (unitless, 0-1 or 0-100 scale)
    powerFactorPhaseA: toNumber(raw.power_factor_phase_a, 0),
    powerFactorPhaseB: toNumber(raw.power_factor_phase_b, 0),
    powerFactorPhaseC: toNumber(raw.power_factor_phase_c, 0),
    powerFactorTotal: toNumber(raw.power_factor, 0),
    
    // Frequency - already in Hz
    frequency: toNumber(raw.frequency, 60),
    
    // Timestamp
    timestamp: raw.created_at ? new Date(raw.created_at) : new Date(),
  };
  
  return { meterInfo, reading };
}

export default adaptMeterReading;
