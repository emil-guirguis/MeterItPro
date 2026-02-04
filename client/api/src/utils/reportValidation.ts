/**
 * Report Validation Utilities
 * 
 * Provides validation functions for report configuration including:
 * - Report name uniqueness
 * - Email format validation
 * - Cron expression format validation
 */

import { Pool } from 'pg';

/**
 * Validates email format using RFC 5322 simplified pattern
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 */
export const isValidEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 simplified pattern for email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
};

/**
 * Validates an array of email addresses
 * @param emails - Array of email addresses to validate
 * @returns Object with isValid boolean and invalidEmails array
 */
export const validateEmailList = (emails: string[]): { isValid: boolean; invalidEmails: string[] } => {
  if (!Array.isArray(emails)) {
    return { isValid: false, invalidEmails: emails ? [String(emails)] : [] };
  }

  const invalidEmails = emails.filter(email => !isValidEmailFormat(email));
  
  return {
    isValid: invalidEmails.length === 0,
    invalidEmails
  };
};

/**
 * Validates cron expression format
 * Supports both 5-field (minute hour day month dayOfWeek) 
 * and 6-field (second minute hour day month dayOfWeek) formats
 * @param cronExpression - Cron expression to validate
 * @returns true if cron expression format is valid, false otherwise
 */
export const isValidCronExpression = (cronExpression: string): boolean => {
  if (!cronExpression || typeof cronExpression !== 'string') {
    return false;
  }

  const trimmed = cronExpression.trim();
  const parts = trimmed.split(/\s+/);

  // Cron expressions should have 5 or 6 fields
  // 5 fields: minute hour day month dayOfWeek
  // 6 fields: second minute hour day month dayOfWeek
  if (parts.length !== 5 && parts.length !== 6) {
    return false;
  }

  // Each field should contain only valid cron characters
  // Valid characters: digits, *, /, -, ,
  const validFieldPattern = /^[\d\*\/\-,]+$/;
  
  return parts.every(part => {
    if (!validFieldPattern.test(part)) {
      return false;
    }

    // Additional validation for specific patterns
    // Check for invalid patterns like multiple consecutive operators
    if (/[\/\-,]{2,}/.test(part)) {
      return false;
    }

    // Check for invalid range patterns (e.g., "5-2" where start > end)
    if (part.includes('-') && !part.includes(',')) {
      const rangeParts = part.split('-');
      if (rangeParts.length === 2) {
        const [start, end] = rangeParts;
        // Both should be numeric or one should be *
        if (start !== '*' && end !== '*' && /^\d+$/.test(start) && /^\d+$/.test(end)) {
          if (parseInt(start, 10) > parseInt(end, 10)) {
            return false;
          }
        }
      }
    }

    return true;
  });
};

/**
 * Checks if a report name is unique in the database
 * @param pool - PostgreSQL connection pool
 * @param reportName - Report name to check
 * @param excludeReportId - Optional report ID to exclude from uniqueness check (for updates)
 * @returns Promise resolving to true if name is unique, false otherwise
 */
export const isReportNameUnique = async (
  pool: Pool,
  reportName: string,
  excludeReportId?: string
): Promise<boolean> => {
  if (!reportName || typeof reportName !== 'string') {
    return false;
  }

  try {
    let query = 'SELECT COUNT(*) as count FROM reports WHERE name = $1';
    const params: any[] = [reportName.trim()];

    // If excluding a specific report ID (for updates), add that to the query
    if (excludeReportId) {
      query += ' AND id != $2';
      params.push(excludeReportId);
    }

    const result = await pool.query(query, params);
    const count = parseInt(result.rows[0].count, 10);
    
    return count === 0;
  } catch (error) {
    console.error('[reportValidation] Error checking report name uniqueness:', error);
    throw new Error(`Failed to validate report name uniqueness: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates a complete report configuration
 * @param pool - PostgreSQL connection pool
 * @param reportConfig - Report configuration object
 * @param excludeReportId - Optional report ID to exclude from uniqueness check (for updates)
 * @returns Promise resolving to validation result object
 */
export interface ReportValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateReportConfig = async (
  pool: Pool,
  reportConfig: {
    name?: string;
    type?: string;
    schedule?: string;
    recipients?: string[];
    config?: Record<string, any>;
  },
  excludeReportId?: string
): Promise<ReportValidationResult> => {
  const errors: string[] = [];

  // Validate name
  if (!reportConfig.name || typeof reportConfig.name !== 'string') {
    errors.push('Report name is required and must be a string');
  } else if (reportConfig.name.trim().length === 0) {
    errors.push('Report name cannot be empty');
  } else if (reportConfig.name.length > 255) {
    errors.push('Report name must not exceed 255 characters');
  } else {
    // Check uniqueness
    const isUnique = await isReportNameUnique(pool, reportConfig.name, excludeReportId);
    if (!isUnique) {
      errors.push('Report name already exists');
    }
  }

  // Validate type
  if (!reportConfig.type || typeof reportConfig.type !== 'string') {
    errors.push('Report type is required and must be a string');
  } else if (reportConfig.type.trim().length === 0) {
    errors.push('Report type cannot be empty');
  }

  // Validate schedule
  if (!reportConfig.schedule || typeof reportConfig.schedule !== 'string') {
    errors.push('Report schedule is required and must be a string');
  } else if (!isValidCronExpression(reportConfig.schedule)) {
    errors.push('Report schedule must be a valid cron expression');
  }

  // Validate recipients
  if (!Array.isArray(reportConfig.recipients)) {
    errors.push('Recipients must be an array');
  } else if (reportConfig.recipients.length === 0) {
    errors.push('At least one recipient is required');
  } else {
    const emailValidation = validateEmailList(reportConfig.recipients);
    if (!emailValidation.isValid) {
      errors.push(`Invalid email format in recipients: ${emailValidation.invalidEmails.join(', ')}`);
    }
  }

  // Validate config (optional, but if provided should be an object)
  if (reportConfig.config !== undefined && typeof reportConfig.config !== 'object') {
    errors.push('Report config must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates recipient email list for updates
 * @param recipients - Array of email addresses
 * @returns Validation result object
 */
export const validateRecipients = (recipients: string[]): ReportValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(recipients)) {
    errors.push('Recipients must be an array');
  } else if (recipients.length === 0) {
    errors.push('At least one recipient is required');
  } else {
    const emailValidation = validateEmailList(recipients);
    if (!emailValidation.isValid) {
      errors.push(`Invalid email format in recipients: ${emailValidation.invalidEmails.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
