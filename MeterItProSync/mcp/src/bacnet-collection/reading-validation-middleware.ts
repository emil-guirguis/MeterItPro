/**
 * Reading Validation Middleware
 * 
 * Integrates meter reading validation into the upload pipeline.
 * Ensures only real BACnet data is uploaded to the Client System.
 */

import { MeterReadingEntity } from '../entities/index.js';
import MeterReadingValidator, { ValidationResult } from '../helpers/meter-reading-validator.js';

export interface ValidationMiddlewareConfig {
  strictMode?: boolean; // If true, reject any reading with warnings
  logValidationResults?: boolean;
  validateBeforeUpload?: boolean;
}

export interface ValidationReport {
  timestamp: Date;
  batchSize: number;
  validReadings: number;
  invalidReadings: number;
  mockDataDetected: number;
  realDataReadings: number;
  unknownSourceReadings: number;
  details: ValidationResult[];
  summary: string;
}

export class ReadingValidationMiddleware {
  private validator: MeterReadingValidator;
  private config: ValidationMiddlewareConfig;
  private validationHistory: ValidationReport[] = [];

  constructor(config: ValidationMiddlewareConfig = {}) {
    this.validator = new MeterReadingValidator();
    this.config = {
      strictMode: false,
      logValidationResults: true,
      validateBeforeUpload: true,
      ...config,
    };
  }

  /**
   * Validate readings before upload
   */
  async validateReadingsBeforeUpload(
    readings: MeterReadingEntity[],
    deviceIps?: Map<number, string>
  ): Promise<{
    validReadings: MeterReadingEntity[];
    invalidReadings: MeterReadingEntity[];
    report: ValidationReport;
  }> {
    if (!this.config.validateBeforeUpload) {
      return {
        validReadings: readings,
        invalidReadings: [],
        report: this.createEmptyReport(readings.length),
      };
    }

    const results = this.validator.validateBatch(readings, deviceIps);
    const validReadings: MeterReadingEntity[] = [];
    const invalidReadings: MeterReadingEntity[] = [];

    readings.forEach((reading, index) => {
      const result = results[index];
      
      if (this.config.strictMode) {
        // Strict mode: reject if any issues or warnings
        if (result.isValid && result.warnings.length === 0) {
          validReadings.push(reading);
        } else {
          invalidReadings.push(reading);
        }
      } else {
        // Normal mode: only reject if errors
        if (result.isValid) {
          validReadings.push(reading);
        } else {
          invalidReadings.push(reading);
        }
      }
    });

    const report = this.generateReport(readings, results);
    this.validationHistory.push(report);

    if (this.config.logValidationResults) {
      this.logValidationReport(report);
    }

    return { validReadings, invalidReadings, report };
  }

  /**
   * Validate a single reading
   */
  validateReading(reading: MeterReadingEntity, deviceIp?: string): ValidationResult {
    return this.validator.validateReading(reading, deviceIp);
  }

  /**
   * Generate validation report
   */
  private generateReport(readings: MeterReadingEntity[], results: ValidationResult[]): ValidationReport {
    const summary = this.validator.getSummary(results);
    
    return {
      timestamp: new Date(),
      batchSize: readings.length,
      validReadings: summary.validReadings,
      invalidReadings: readings.length - summary.validReadings,
      mockDataDetected: summary.mockDataReadings,
      realDataReadings: summary.realDataReadings,
      unknownSourceReadings: summary.unknownSourceReadings,
      details: results,
      summary: `Validated ${readings.length} readings: ${summary.validReadings} valid, ${summary.realDataReadings} confirmed real data, ${summary.mockDataReadings} mock data detected`,
    };
  }

  /**
   * Create empty report (when validation is disabled)
   */
  private createEmptyReport(batchSize: number): ValidationReport {
    return {
      timestamp: new Date(),
      batchSize,
      validReadings: batchSize,
      invalidReadings: 0,
      mockDataDetected: 0,
      realDataReadings: batchSize,
      unknownSourceReadings: 0,
      details: [],
      summary: 'Validation disabled',
    };
  }

  /**
   * Log validation report
   */
  private logValidationReport(report: ValidationReport): void {
    console.log('\n📊 [VALIDATION REPORT]');
    console.log(`   Timestamp: ${report.timestamp.toISOString()}`);
    console.log(`   Batch Size: ${report.batchSize}`);
    console.log(`   Valid Readings: ${report.validReadings}`);
    console.log(`   Invalid Readings: ${report.invalidReadings}`);
    console.log(`   Real Data: ${report.realDataReadings}`);
    console.log(`   Mock Data Detected: ${report.mockDataDetected}`);
    console.log(`   Unknown Source: ${report.unknownSourceReadings}`);
    console.log(`   Summary: ${report.summary}`);

    // Log details of invalid readings
    const invalidDetails = report.details.filter((r) => !r.isValid);
    if (invalidDetails.length > 0) {
      console.log(`\n   ⚠️  Invalid Reading Details:`);
      invalidDetails.forEach((detail, index) => {
        console.log(`      Reading ${index + 1}:`);
        detail.issues.forEach((issue) => {
          console.log(`         - [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}`);
        });
      });
    }

    // Log mock data detections
    const mockDetails = report.details.filter((r) => r.source === 'mock');
    if (mockDetails.length > 0) {
      console.log(`\n   🚨 Mock Data Detected:`);
      mockDetails.forEach((detail, index) => {
        console.log(`      Reading ${index + 1}: ${detail.metadata.meterId}`);
        detail.issues.forEach((issue) => {
          if (issue.code === 'MOCK_DATA_DETECTED') {
            console.log(`         - ${issue.message}`);
          }
        });
      });
    }

    console.log('');
  }

  /**
   * Get validation history
   */
  getValidationHistory(): ValidationReport[] {
    return this.validationHistory;
  }

  /**
   * Get latest validation report
   */
  getLatestReport(): ValidationReport | null {
    return this.validationHistory.length > 0 ? this.validationHistory[this.validationHistory.length - 1] : null;
  }

  /**
   * Get validation statistics
   */
  getStatistics(): {
    totalBatches: number;
    totalReadingsValidated: number;
    totalValidReadings: number;
    totalInvalidReadings: number;
    totalMockDataDetected: number;
    totalRealDataReadings: number;
    averageValidationRate: number;
  } {
    if (this.validationHistory.length === 0) {
      return {
        totalBatches: 0,
        totalReadingsValidated: 0,
        totalValidReadings: 0,
        totalInvalidReadings: 0,
        totalMockDataDetected: 0,
        totalRealDataReadings: 0,
        averageValidationRate: 0,
      };
    }

    const totals = this.validationHistory.reduce(
      (acc, report) => ({
        totalReadings: acc.totalReadings + report.batchSize,
        totalValid: acc.totalValid + report.validReadings,
        totalInvalid: acc.totalInvalid + report.invalidReadings,
        totalMock: acc.totalMock + report.mockDataDetected,
        totalReal: acc.totalReal + report.realDataReadings,
      }),
      { totalReadings: 0, totalValid: 0, totalInvalid: 0, totalMock: 0, totalReal: 0 }
    );

    return {
      totalBatches: this.validationHistory.length,
      totalReadingsValidated: totals.totalReadings,
      totalValidReadings: totals.totalValid,
      totalInvalidReadings: totals.totalInvalid,
      totalMockDataDetected: totals.totalMock,
      totalRealDataReadings: totals.totalReal,
      averageValidationRate: (totals.totalValid / totals.totalReadings) * 100,
    };
  }

  /**
   * Reset validation history
   */
  resetHistory(): void {
    this.validationHistory = [];
  }
}

export default ReadingValidationMiddleware;
