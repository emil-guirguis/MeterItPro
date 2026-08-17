/**
 * Meter Reading Validation Configuration
 * 
 * Controls how meter readings are validated to ensure real data is being used.
 * Can be configured via environment variables.
 */

export interface ValidationConfig {
  // Enable/disable validation
  enabled: boolean;

  // Strict mode: reject readings with warnings (not just errors)
  strictMode: boolean;

  // Log validation results to console
  logValidationResults: boolean;

  // Validate before uploading to Client System
  validateBeforeUpload: boolean;

  // Reject readings with mock data patterns
  rejectMockData: boolean;

  // Reject readings with unrealistic values
  rejectUnrealisticValues: boolean;

  // Minimum valid readings percentage (0-100)
  // If validation rate drops below this, log a warning
  minimumValidationRate: number;

  // Alert threshold for mock data detection (0-100)
  // If mock data percentage exceeds this, trigger alert
  mockDataAlertThreshold: number;

  // Enable detailed logging for debugging
  debugMode: boolean;
}

/**
 * Load validation configuration from environment variables
 */
export function loadValidationConfig(): ValidationConfig {
  return {
    enabled: process.env.METER_READING_VALIDATION_ENABLED !== 'false',
    strictMode: process.env.METER_READING_VALIDATION_STRICT_MODE === 'true',
    logValidationResults: process.env.METER_READING_VALIDATION_LOG !== 'false',
    validateBeforeUpload: process.env.METER_READING_VALIDATION_BEFORE_UPLOAD !== 'false',
    rejectMockData: process.env.METER_READING_REJECT_MOCK_DATA !== 'false',
    rejectUnrealisticValues: process.env.METER_READING_REJECT_UNREALISTIC !== 'false',
    minimumValidationRate: parseFloat(process.env.METER_READING_MIN_VALIDATION_RATE || '95'),
    mockDataAlertThreshold: parseFloat(process.env.METER_READING_MOCK_DATA_ALERT_THRESHOLD || '5'),
    debugMode: process.env.METER_READING_VALIDATION_DEBUG === 'true',
  };
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  enabled: true,
  strictMode: false,
  logValidationResults: true,
  validateBeforeUpload: true,
  rejectMockData: true,
  rejectUnrealisticValues: false,
  minimumValidationRate: 95,
  mockDataAlertThreshold: 5,
  debugMode: false,
};

/**
 * Validation configuration presets
 */
export const VALIDATION_PRESETS = {
  // Production: strict validation, reject mock data
  production: {
    enabled: true,
    strictMode: false,
    logValidationResults: true,
    validateBeforeUpload: true,
    rejectMockData: true,
    rejectUnrealisticValues: false,
    minimumValidationRate: 98,
    mockDataAlertThreshold: 1,
    debugMode: false,
  } as ValidationConfig,

  // Development: lenient validation, allow warnings
  development: {
    enabled: true,
    strictMode: false,
    logValidationResults: true,
    validateBeforeUpload: true,
    rejectMockData: false,
    rejectUnrealisticValues: false,
    minimumValidationRate: 80,
    mockDataAlertThreshold: 20,
    debugMode: true,
  } as ValidationConfig,

  // Testing: very strict validation
  testing: {
    enabled: true,
    strictMode: true,
    logValidationResults: true,
    validateBeforeUpload: true,
    rejectMockData: true,
    rejectUnrealisticValues: true,
    minimumValidationRate: 100,
    mockDataAlertThreshold: 0,
    debugMode: true,
  } as ValidationConfig,

  // Disabled: no validation
  disabled: {
    enabled: false,
    strictMode: false,
    logValidationResults: false,
    validateBeforeUpload: false,
    rejectMockData: false,
    rejectUnrealisticValues: false,
    minimumValidationRate: 0,
    mockDataAlertThreshold: 100,
    debugMode: false,
  } as ValidationConfig,
};

/**
 * Get validation preset by environment
 */
export function getValidationPreset(environment?: string): ValidationConfig {
  const env = environment || process.env.NODE_ENV || 'development';

  switch (env.toLowerCase()) {
    case 'production':
    case 'prod':
      return VALIDATION_PRESETS.production;
    case 'testing':
    case 'test':
      return VALIDATION_PRESETS.testing;
    case 'development':
    case 'dev':
      return VALIDATION_PRESETS.development;
    case 'disabled':
      return VALIDATION_PRESETS.disabled;
    default:
      return DEFAULT_VALIDATION_CONFIG;
  }
}
