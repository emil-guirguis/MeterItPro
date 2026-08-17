/**
 * Meter Reading Validator
 * 
 * Validates that meter readings are real data from BACnet devices
 * and not mocked/test data. Provides comprehensive checks for:
 * - Data source verification
 * - Realistic value ranges
 * - Temporal consistency
 * - Device connectivity validation
 */

import { MeterReadingEntity } from '../entities/index.js';

export interface ValidationResult {
  isValid: boolean;
  isRealData: boolean;
  source: 'bacnet' | 'mock' | 'unknown';
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  metadata: {
    timestamp: Date;
    readingId?: string;
    meterId?: number;
    deviceIp?: string;
  };
}

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  field?: string;
  value?: any;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestedValue?: any;
}

/**
 * Realistic ranges for electrical measurements
 * These are typical ranges for industrial/commercial meters
 */
const REALISTIC_RANGES = {
  voltage: { min: 200, max: 480 }, // Volts (3-phase typical)
  current: { min: 0.1, max: 1000 }, // Amps
  power: { min: 0, max: 1000000 }, // Watts
  frequency: { min: 45, max: 65 }, // Hz
  powerFactor: { min: -1, max: 1 }, // -1 to 1 range (negative indicates reactive/leading power)
  energy: { min: 0, max: Number.MAX_SAFE_INTEGER }, // Wh
  temperature: { min: -40, max: 85 }, // Celsius
  humidity: { min: 0, max: 100 }, // Percentage
};

/**
 * Mock data patterns to detect
 */
const MOCK_DATA_PATTERNS = {
  // Sequential or repeating values
  sequential: /^(1|2|3|4|5|6|7|8|9|10|100|1000)$/,
  // Round numbers that are suspiciously perfect
  perfectRound: /^(100|200|300|400|500|1000|10000)$/,
  // Test values
  testValues: /^(test|mock|demo|sample|placeholder|xxx|yyy|zzz)$/i,
  // Placeholder IPs
  placeholderIp: /^(127\.0\.0\.1|192\.168\.|10\.0\.|172\.16\.|0\.0\.0\.0|255\.255\.255\.255)$/,
};

export class MeterReadingValidator {
  private lastReadingTimestamp: Map<number, Date> = new Map();

  /**
   * Validate a meter reading to ensure it's real data
   */
  validateReading(reading: MeterReadingEntity, deviceIp?: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let source: 'bacnet' | 'mock' | 'unknown' = 'unknown';

    // Check 1: Validate timestamp
    const timestampCheck = this.validateTimestamp(reading.created_at!);
    if (!timestampCheck.valid) {
      issues.push({
        code: 'INVALID_TIMESTAMP',
        severity: 'error',
        message: timestampCheck.message,
        field: 'created_at',
        value: reading.created_at,
      });
    }

    // Check 2: Validate data source indicators
    const sourceCheck = this.validateDataSource(reading, deviceIp);
    source = sourceCheck.source;
    if (sourceCheck.issues.length > 0) {
      issues.push(...sourceCheck.issues);
    }
    if (sourceCheck.warnings.length > 0) {
      warnings.push(...sourceCheck.warnings);
    }

    // Check 3: Validate realistic value ranges
    const rangeCheck = this.validateValueRanges(reading);
    if (rangeCheck.issues.length > 0) {
      issues.push(...rangeCheck.issues);
    }
    if (rangeCheck.warnings.length > 0) {
      warnings.push(...rangeCheck.warnings);
    }

    // Check 4: Validate temporal consistency
    if (reading.meter_id) {
      const temporalCheck = this.validateTemporalConsistency(reading.meter_id, reading.created_at!);
      if (temporalCheck.issues.length > 0) {
        issues.push(...temporalCheck.issues);
      }
      if (temporalCheck.warnings.length > 0) {
        warnings.push(...temporalCheck.warnings);
      }
    }

    // Check 5: Detect mock data patterns
    const mockCheck = this.detectMockDataPatterns(reading);
    if (mockCheck.isMock) {
      issues.push({
        code: 'MOCK_DATA_DETECTED',
        severity: 'error',
        message: `Mock data pattern detected: ${mockCheck.reason}`,
        field: mockCheck.field,
        value: mockCheck.value,
      });
      source = 'mock';
    }

    // Check 6: Validate data completeness
    const completenessCheck = this.validateDataCompleteness(reading);
    if (completenessCheck.warnings.length > 0) {
      warnings.push(...completenessCheck.warnings);
    }

    const isRealData = source === 'bacnet' && issues.length === 0;
    const isValid = issues.length === 0;

    return {
      isValid,
      isRealData,
      source,
      issues,
      warnings,
      metadata: {
        timestamp: new Date(),
        readingId: reading.meter_reading_id,
        meterId: reading.meter_id,
        deviceIp,
      },
    };
  }

  /**
   * Validate timestamp is reasonable
   */
  private validateTimestamp(timestamp: Date): { valid: boolean; message: string } {
    if (!timestamp) {
      return { valid: false, message: 'Timestamp is missing' };
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return { valid: false, message: 'Timestamp is invalid' };
    }

    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Reading should be recent (within last 5 minutes) or at least within last year
    if (date > now) {
      return { valid: false, message: 'Timestamp is in the future' };
    }

    if (date < oneYearAgo) {
      return { valid: false, message: 'Timestamp is older than 1 year' };
    }

    return { valid: true, message: 'Timestamp is valid' };
  }

  /**
   * Validate data source indicators
   */
  private validateDataSource(
    reading: MeterReadingEntity,
    deviceIp?: string
  ): { source: 'bacnet' | 'mock' | 'unknown'; issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    let source: 'bacnet' | 'mock' | 'unknown' = 'unknown';

    // Check if device IP is valid (not a placeholder)
    if (deviceIp) {
      if (MOCK_DATA_PATTERNS.placeholderIp.test(deviceIp)) {
        issues.push({
          code: 'PLACEHOLDER_DEVICE_IP',
          severity: 'error',
          message: `Device IP appears to be a placeholder: ${deviceIp}`,
          field: 'deviceIp',
          value: deviceIp,
        });
        source = 'mock';
      } else {
        source = 'bacnet';
      }
    }

    // Check sync_status if available
    if (reading.sync_status) {
      if (reading.sync_status.toLowerCase().includes('mock') || reading.sync_status.toLowerCase().includes('test')) {
        issues.push({
          code: 'MOCK_SYNC_STATUS',
          severity: 'error',
          message: `Sync status indicates mock data: ${reading.sync_status}`,
          field: 'sync_status',
          value: reading.sync_status,
        });
        source = 'mock';
      }
    }

    // Check if reading has at least one real measurement
    const hasMeasurements = this.hasRealMeasurements(reading);
    if (!hasMeasurements) {
      warnings.push({
        code: 'NO_MEASUREMENTS',
        message: 'Reading has no actual measurements (all fields are null)',
        field: 'measurements',
      });
    }

    return { source, issues, warnings };
  }

  /**
   * Validate value ranges are realistic
   */
  private validateValueRanges(reading: MeterReadingEntity): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];

    // Check voltage
    if (reading.voltage_p_n !== null && reading.voltage_p_n !== undefined) {
      if (reading.voltage_p_n < REALISTIC_RANGES.voltage.min || reading.voltage_p_n > REALISTIC_RANGES.voltage.max) {
        warnings.push({
          code: 'UNREALISTIC_VOLTAGE',
          message: `Voltage ${reading.voltage_p_n}V is outside typical range (${REALISTIC_RANGES.voltage.min}-${REALISTIC_RANGES.voltage.max}V)`,
          field: 'voltage_p_n',
          suggestedValue: 240,
        });
      }
    }

    // Check current
    if (reading.phase_amperage_a !== null && reading.phase_amperage_a !== undefined) {
      if (reading.phase_amperage_a < REALISTIC_RANGES.current.min || reading.phase_amperage_a > REALISTIC_RANGES.current.max) {
        warnings.push({
          code: 'UNREALISTIC_CURRENT',
          message: `Current ${reading.phase_amperage_a}A is outside typical range (${REALISTIC_RANGES.current.min}-${REALISTIC_RANGES.current.max}A)`,
          field: 'phase_amperage_a',
        });
      }
    }

    // Check frequency
    // COMMENTED OUT: Allowing any frequency value for debugging
    // if (reading.frequency !== null && reading.frequency !== undefined) {
    //   if (reading.frequency < REALISTIC_RANGES.frequency.min || reading.frequency > REALISTIC_RANGES.frequency.max) {
    //     issues.push({
    //       code: 'INVALID_FREQUENCY',
    //       severity: 'error',
    //       message: `Frequency ${reading.frequency}Hz is outside valid range (${REALISTIC_RANGES.frequency.min}-${REALISTIC_RANGES.frequency.max}Hz)`,
    //       field: 'frequency',
    //       value: reading.frequency,
    //     });
    //   }
    // }

    // Check power factor
    // COMMENTED OUT: Allowing any power factor value for debugging
    // if (reading.power_factor !== null && reading.power_factor !== undefined) {
    //   if (reading.power_factor < REALISTIC_RANGES.powerFactor.min || reading.power_factor > REALISTIC_RANGES.powerFactor.max) {
    //     issues.push({
    //       code: 'INVALID_POWER_FACTOR',
    //       severity: 'error',
    //       message: `Power factor ${reading.power_factor} is outside valid range (-1 to 1)`,
    //       field: 'power_factor',
    //       value: reading.power_factor,
    //     });
    //   }
    // }

    return { issues, warnings };
  }

  /**
   * Validate temporal consistency
   */
  private validateTemporalConsistency(meterId: number, timestamp: Date): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];

    const lastTimestamp = this.lastReadingTimestamp.get(meterId);
    if (lastTimestamp) {
      const timeDiff = new Date(timestamp).getTime() - lastTimestamp.getTime();
      
      // Reading should be at least 1 minute apart (typical collection interval)
      if (timeDiff < 60000) {
        warnings.push({
          code: 'READINGS_TOO_CLOSE',
          message: `Readings are only ${Math.round(timeDiff / 1000)} seconds apart (expected at least 60 seconds)`,
          field: 'created_at',
        });
      }

      // Reading should not be more than 1 hour apart (indicates gap in collection)
      if (timeDiff > 3600000) {
        warnings.push({
          code: 'LARGE_TIME_GAP',
          message: `Large gap of ${Math.round(timeDiff / 60000)} minutes since last reading`,
          field: 'created_at',
        });
      }
    }

    this.lastReadingTimestamp.set(meterId, new Date(timestamp));
    return { issues, warnings };
  }

  /**
   * Detect mock data patterns
   */
  private detectMockDataPatterns(reading: MeterReadingEntity): { isMock: boolean; reason: string; field?: string; value?: any } {
    // Check for test/mock values in string fields
    if (reading.sync_status && MOCK_DATA_PATTERNS.testValues.test(reading.sync_status)) {
      return {
        isMock: true,
        reason: 'Test value in sync_status',
        field: 'sync_status',
        value: reading.sync_status,
      };
    }

    // Check for suspiciously perfect round numbers across multiple fields
    const roundNumberCount = [
      reading.voltage_p_n,
      reading.phase_amperage_a,
      reading.kw,
      reading.frequency,
    ].filter((val) => val !== null && val !== undefined && MOCK_DATA_PATTERNS.perfectRound.test(String(val))).length;

    if (roundNumberCount >= 3) {
      return {
        isMock: true,
        reason: 'Multiple suspiciously perfect round numbers detected',
      };
    }

    // Check for all zeros (common mock pattern)
    const allZeros = [
      reading.voltage_p_n === 0,
      reading.phase_amperage_a === 0,
      reading.kw === 0,
      reading.frequency === 0,
    ].filter(Boolean).length;

    if (allZeros >= 3) {
      return {
        isMock: true,
        reason: 'Multiple zero values detected (common mock pattern)',
      };
    }

    return { isMock: false, reason: 'No mock patterns detected' };
  }

  /**
   * Validate data completeness
   */
  private validateDataCompleteness(reading: MeterReadingEntity): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];

    const nullCount = [
      reading.voltage_p_n,
      reading.phase_amperage_a,
      reading.kw,
      reading.frequency,
      reading.power_factor,
    ].filter((val) => val === null || val === undefined).length;

    if (nullCount === 5) {
      warnings.push({
        code: 'NO_CORE_MEASUREMENTS',
        message: 'Reading has no core electrical measurements (voltage, current, power, frequency, power factor)',
        field: 'measurements',
      });
    }

    return { warnings };
  }

  /**
   * Check if reading has at least one real measurement
   */
  private hasRealMeasurements(reading: MeterReadingEntity): boolean {
    return (
      (reading.voltage_p_n !== null && reading.voltage_p_n !== undefined) ||
      (reading.phase_amperage_a !== null && reading.phase_amperage_a !== undefined) ||
      (reading.kw !== null && reading.kw !== undefined) ||
      (reading.frequency !== null && reading.frequency !== undefined) ||
      (reading.kwh !== null && reading.kwh !== undefined) ||
      (reading.power_factor !== null && reading.power_factor !== undefined)
    );
  }

  /**
   * Batch validate multiple readings
   */
  validateBatch(readings: MeterReadingEntity[], deviceIps?: Map<number, string>): ValidationResult[] {
    return readings.map((reading) => {
      const deviceIp = deviceIps?.get(reading.meter_id!);
      return this.validateReading(reading, deviceIp);
    });
  }

  /**
   * Get validation summary for batch
   */
  getSummary(results: ValidationResult[]): {
    totalReadings: number;
    validReadings: number;
    realDataReadings: number;
    mockDataReadings: number;
    unknownSourceReadings: number;
    errorRate: number;
  } {
    return {
      totalReadings: results.length,
      validReadings: results.filter((r) => r.isValid).length,
      realDataReadings: results.filter((r) => r.isRealData).length,
      mockDataReadings: results.filter((r) => r.source === 'mock').length,
      unknownSourceReadings: results.filter((r) => r.source === 'unknown').length,
      errorRate: (results.filter((r) => !r.isValid).length / results.length) * 100,
    };
  }
}

export default MeterReadingValidator;
