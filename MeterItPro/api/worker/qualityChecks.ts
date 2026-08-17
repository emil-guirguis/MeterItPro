/**
 * Stateless per-reading quality checks, applied at ingest.
 *
 * Pure functions — no DB access, safe in the /readings/batch hot path.
 * Stateful checks (kWh delta, spike vs history) belong in qualityEngine.
 */

export type ReadingQuality = 'valid' | 'suspect' | 'estimated' | 'missing';

export interface QualityResult {
  quality: ReadingQuality;
  flags: string[];
}

// Sanity caps. Generous on purpose — goal is catching garbage (sensor faults,
// unit errors, mock data), not policing real-world edge cases.
const MAX_KW = 100_000;        // 100 MW single element
const MAX_KWH = 10_000_000;    // cumulative register cap
const MAX_VOLTAGE = 100_000;   // volts
const MIN_FREQUENCY = 40;      // Hz
const MAX_FREQUENCY = 70;
const FUTURE_TOLERANCE_MS = 5 * 60_000; // clock skew allowance

const POWER_FIELDS = ['kw', 'peak_kw', 'phase_kw_a', 'phase_kw_b', 'phase_kw_c', 'kva', 'kvar'] as const;
const ENERGY_FIELDS = ['kwh', 'mwh', 'kvah', 'kvarh', 'calculated_kwh'] as const;
const PF_FIELDS = ['power_factor', 'pf_a', 'pf_b', 'pf_c'] as const;
const VOLTAGE_FIELDS = [
  'voltage_a_b', 'voltage_a_n', 'voltage_b_c', 'voltage_b_n',
  'voltage_c_a', 'voltage_c_n', 'voltage_p_n', 'voltage_p_p',
] as const;

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Evaluate one raw reading (as received by /readings/batch).
 * Returns quality + machine-readable flags for the validation_flags column.
 */
export function checkReadingQuality(reading: Record<string, unknown>, now: Date = new Date()): QualityResult {
  const flags: string[] = [];

  for (const field of POWER_FIELDS) {
    const v = num(reading[field]);
    if (v === null) continue;
    if (v < 0 || v > MAX_KW) { flags.push(`range:${field}`); }
  }

  for (const field of ENERGY_FIELDS) {
    const v = num(reading[field]);
    if (v === null) continue;
    if (v < 0 || v > MAX_KWH) { flags.push(`range:${field}`); }
  }

  for (const field of PF_FIELDS) {
    const v = num(reading[field]);
    if (v === null) continue;
    if (v < -1 || v > 1) { flags.push(`pf_range:${field}`); }
  }

  for (const field of VOLTAGE_FIELDS) {
    const v = num(reading[field]);
    if (v === null) continue;
    if (v < 0 || v > MAX_VOLTAGE) { flags.push(`voltage_range:${field}`); }
  }

  const freq = num(reading.frequency);
  if (freq !== null && freq !== 0 && (freq < MIN_FREQUENCY || freq > MAX_FREQUENCY)) {
    flags.push('frequency_range');
  }

  if (reading.created_at) {
    const ts = new Date(reading.created_at as string | number | Date);
    if (!isNaN(ts.getTime()) && ts.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
      flags.push('future_timestamp');
    }
  }

  // Informational only — meter communicating but reporting no energy.
  // Quality stays 'valid'; the zero-reading notification rule decides severity.
  const kwh = num(reading.kwh);
  const kw = num(reading.kw);
  if (kwh === 0 && kw === 0) {
    flags.push('zero_reading');
  }

  const suspect = flags.some(f => !f.startsWith('zero_reading'));
  return { quality: suspect ? 'suspect' : 'valid', flags };
}
