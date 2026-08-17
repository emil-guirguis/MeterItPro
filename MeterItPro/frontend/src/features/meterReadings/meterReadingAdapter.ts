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
  // meter_type?: string;
  serial_number?: string;
  meter_ip?: string;
  meter_port?: string;
  meter_protocol?: string;
  meter_notes?: string;
  element_name?: string;
  element_number?: number;

  // Energy totals
  kwh?: number;

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
  amperage?: number;
  phase_amperage_a?: number;
  phase_amperage_b?: number;
  phase_amperage_c?: number;

  // Power
  kw?: number;
  phase_kw_a?: number;
  phase_kw_b?: number;
  phase_kw_c?: number;

  // Apparent power
  kva?: number;
  phase_kva_a?: number;
  phase_kva_b?: number;
  phase_kva_c?: number;

  // Reactive power
  kvar?: number;
  phase_kvar_a?: number;
  phase_kvar_b?: number;
  phase_kvar_c?: number;

  // Power factor
  pf?: number;
  pf_a?: number;
  pf_b?: number;
  pf_c?: number;

  // Frequency
  frequency?: number;

  // Other
  peak_kw?: number;
  total_thdv?: number;
  phase_thdv_a?: number;
  phase_thdv_b?: number;
  phase_thdv_c?: number;
}

export interface MeterInfo {
  driver: string;
  description: string;
  serialNumber: string;
}

export interface MeterReadingData {
  // Energy totals
  activeEnergyTotal: number;

  // Demand
  maximumDemandReal: number;

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
export function adaptMeterReading(raw: RawMeterReading, favoriteName?: string): {
  meterInfo: MeterInfo;
  reading: MeterReadingData;
} {
  // Extract meter info
  const meterInfo: MeterInfo = {
    driver: raw.meter_protocol || 'Unknown Driver',
    description: favoriteName || (raw.meter_name && raw.element_number && raw.element_name
      ? `${raw.meter_name} (${String(raw.element_number).trim()}) ${raw.element_name}`
      : raw.meter_name || raw.meter_notes || 'No Description'),
    serialNumber: raw.serial_number || 'N/A',
  };
  
  // Transform reading data
  // Note: Values are divided by 1000 where appropriate to convert from W to kW, VA to kVA, etc.
  const reading: MeterReadingData = {
    // Energy totals (already in kWh from database)
    activeEnergyTotal: toNumber(raw.kwh, 0),

    // Demand (already in kW from database)
    maximumDemandReal: toNumber(raw.peak_kw, 0),

    // Phase voltages (line-to-neutral) - already in V
    voltagePhaseA: toNumber(raw.voltage_a_n, 0),
    voltagePhaseB: toNumber(raw.voltage_b_n, 0),
    voltagePhaseC: toNumber(raw.voltage_c_n, 0),

    // Line voltages (line-to-line) - already in V
    voltageAB: toNumber(raw.voltage_a_b, 0),
    voltageBC: toNumber(raw.voltage_b_c, 0),
    voltageCA: toNumber(raw.voltage_c_a, 0),

    // Current per phase - already in A
    currentPhaseA: toNumber(raw.phase_amperage_a, 0),
    currentPhaseB: toNumber(raw.phase_amperage_b, 0),
    currentPhaseC: toNumber(raw.phase_amperage_c, 0),
    currentTotal: toNumber(raw.amperage, 0),

    // Active power - convert to kW if needed (assuming database stores in kW)
    powerPhaseA: toNumber(raw.phase_kw_a, 0),
    powerPhaseB: toNumber(raw.phase_kw_b, 0),
    powerPhaseC: toNumber(raw.phase_kw_c, 0),
    powerTotal: toNumber(raw.kw, 0),

    // Apparent power - convert to kVA if needed (assuming database stores in kVA)
    apparentPowerPhaseA: toNumber(raw.phase_kva_a, 0),
    apparentPowerPhaseB: toNumber(raw.phase_kva_b, 0),
    apparentPowerPhaseC: toNumber(raw.phase_kva_c, 0),
    apparentPowerTotal: toNumber(raw.kva, 0),

    // Reactive power - convert to kVAr if needed (assuming database stores in kVAr)
    reactivePowerPhaseA: toNumber(raw.phase_kvar_a, 0),
    reactivePowerPhaseB: toNumber(raw.phase_kvar_b, 0),
    reactivePowerPhaseC: toNumber(raw.phase_kvar_c, 0),
    reactivePowerTotal: toNumber(raw.kvar, 0),

    // Power factor (unitless, 0-1 or 0-100 scale)
    powerFactorPhaseA: toNumber(raw.pf_a, 0),
    powerFactorPhaseB: toNumber(raw.pf_b, 0),
    powerFactorPhaseC: toNumber(raw.pf_c, 0),
    powerFactorTotal: toNumber(raw.pf, 0),

    // Frequency - already in Hz
    frequency: toNumber(raw.frequency, 60),

    // Timestamp
    timestamp: raw.created_at ? new Date(raw.created_at) : new Date(),
  };
  
  return { meterInfo, reading };
}

export default adaptMeterReading;
