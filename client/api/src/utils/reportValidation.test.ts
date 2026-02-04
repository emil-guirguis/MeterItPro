/**
 * Unit Tests for Report Validation Utilities
 * 
 * Tests email format validation, cron expression validation,
 * and report name uniqueness checking
 */

import {
  isValidEmailFormat,
  validateEmailList,
  isValidCronExpression,
  isReportNameUnique,
  validateReportConfig,
  validateRecipients
} from './reportValidation';
import { Pool } from 'pg';

// Mock the pg module
jest.mock('pg');

describe('Report Validation Utilities', () => {
  describe('isValidEmailFormat', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmailFormat('user@example.com')).toBe(true);
      expect(isValidEmailFormat('test.user@example.co.uk')).toBe(true);
      expect(isValidEmailFormat('user+tag@example.com')).toBe(true);
      expect(isValidEmailFormat('123@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmailFormat('invalid.email')).toBe(false);
      expect(isValidEmailFormat('user@')).toBe(false);
      expect(isValidEmailFormat('@example.com')).toBe(false);
      expect(isValidEmailFormat('user @example.com')).toBe(false);
      expect(isValidEmailFormat('user@example')).toBe(false);
    });

    it('should reject empty or null values', () => {
      expect(isValidEmailFormat('')).toBe(false);
      expect(isValidEmailFormat(null as any)).toBe(false);
      expect(isValidEmailFormat(undefined as any)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidEmailFormat('  user@example.com  ')).toBe(true);
      expect(isValidEmailFormat('user @example.com')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidEmailFormat(123 as any)).toBe(false);
      expect(isValidEmailFormat({} as any)).toBe(false);
      expect(isValidEmailFormat([] as any)).toBe(false);
    });
  });

  describe('validateEmailList', () => {
    it('should validate a list of valid emails', () => {
      const result = validateEmailList(['user1@example.com', 'user2@example.com']);
      expect(result.isValid).toBe(true);
      expect(result.invalidEmails).toHaveLength(0);
    });

    it('should identify invalid emails in a list', () => {
      const result = validateEmailList(['user1@example.com', 'invalid.email', 'user2@example.com']);
      expect(result.isValid).toBe(false);
      expect(result.invalidEmails).toContain('invalid.email');
      expect(result.invalidEmails).toHaveLength(1);
    });

    it('should handle empty list', () => {
      const result = validateEmailList([]);
      expect(result.isValid).toBe(true);
      expect(result.invalidEmails).toHaveLength(0);
    });

    it('should reject non-array input', () => {
      const result = validateEmailList('not-an-array' as any);
      expect(result.isValid).toBe(false);
      expect(result.invalidEmails).toHaveLength(1);
    });

    it('should handle multiple invalid emails', () => {
      const result = validateEmailList(['invalid1', 'invalid2', 'valid@example.com', 'invalid3']);
      expect(result.isValid).toBe(false);
      expect(result.invalidEmails).toHaveLength(3);
    });
  });

  describe('isValidCronExpression', () => {
    it('should validate standard 5-field cron expressions', () => {
      expect(isValidCronExpression('0 0 * * *')).toBe(true); // Daily at midnight
      expect(isValidCronExpression('0 9 * * *')).toBe(true); // Daily at 9 AM
      expect(isValidCronExpression('0 0 * * 0')).toBe(true); // Weekly on Sunday
      expect(isValidCronExpression('0 0 1 * *')).toBe(true); // Monthly on 1st
      expect(isValidCronExpression('*/15 * * * *')).toBe(true); // Every 15 minutes
    });

    it('should validate 6-field cron expressions with seconds', () => {
      expect(isValidCronExpression('0 0 0 * * *')).toBe(true); // Every second at midnight
      expect(isValidCronExpression('0 0 9 * * *')).toBe(true); // Every second at 9 AM
      expect(isValidCronExpression('*/30 * * * * *')).toBe(true); // Every 30 seconds
    });

    it('should validate complex cron expressions', () => {
      expect(isValidCronExpression('0 0 1,15 * *')).toBe(true); // 1st and 15th of month
      expect(isValidCronExpression('0 9-17 * * 1-5')).toBe(true); // 9 AM to 5 PM on weekdays
      expect(isValidCronExpression('*/5 * * * *')).toBe(true); // Every 5 minutes
    });

    it('should reject invalid field counts', () => {
      expect(isValidCronExpression('0 0 *')).toBe(false); // Too few fields
      expect(isValidCronExpression('0 0 * * * * *')).toBe(false); // Too many fields
      expect(isValidCronExpression('')).toBe(false); // Empty string
    });

    it('should reject invalid characters', () => {
      expect(isValidCronExpression('0 0 * * * X')).toBe(false); // Invalid character
      expect(isValidCronExpression('0 0 * * * @')).toBe(false); // Invalid character
      expect(isValidCronExpression('0 0 * * * #')).toBe(false); // Invalid character
    });

    it('should reject invalid range patterns', () => {
      expect(isValidCronExpression('0 0 5-2 * *')).toBe(false); // Invalid range (start > end)
      expect(isValidCronExpression('0 23-5 * * *')).toBe(false); // Invalid range (start > end)
    });

    it('should reject consecutive operators', () => {
      expect(isValidCronExpression('0 0 * * *--')).toBe(false); // Consecutive dashes
      expect(isValidCronExpression('0 0 * * *,,')).toBe(false); // Consecutive commas
      expect(isValidCronExpression('0 0 * * *//')).toBe(false); // Consecutive slashes
    });

    it('should reject null or undefined', () => {
      expect(isValidCronExpression(null as any)).toBe(false);
      expect(isValidCronExpression(undefined as any)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidCronExpression('  0 0 * * *  ')).toBe(true);
      expect(isValidCronExpression('0  0  *  *  *')).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(isValidCronExpression(123 as any)).toBe(false);
      expect(isValidCronExpression({} as any)).toBe(false);
      expect(isValidCronExpression([] as any)).toBe(false);
    });
  });

  describe('isReportNameUnique', () => {
    let mockPool: any;

    beforeEach(() => {
      mockPool = {
        query: jest.fn()
      };
    });

    it('should return true when report name is unique', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await isReportNameUnique(mockPool, 'New Report');
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM reports WHERE name = $1',
        ['New Report']
      );
    });

    it('should return false when report name already exists', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '1' }] });

      const result = await isReportNameUnique(mockPool, 'Existing Report');
      expect(result).toBe(false);
    });

    it('should exclude a specific report ID when checking uniqueness', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await isReportNameUnique(mockPool, 'Report Name', 'report-id-123');
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM reports WHERE name = $1 AND id != $2',
        ['Report Name', 'report-id-123']
      );
    });

    it('should trim whitespace from report name', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '0' }] });

      await isReportNameUnique(mockPool, '  Report Name  ');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM reports WHERE name = $1',
        ['Report Name']
      );
    });

    it('should reject empty or null names', async () => {
      const result = await isReportNameUnique(mockPool, '');
      expect(result).toBe(false);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should throw error on database query failure', async () => {
      mockPool.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(isReportNameUnique(mockPool, 'Report')).rejects.toThrow(
        'Failed to validate report name uniqueness'
      );
    });

    it('should handle non-string names', async () => {
      const result = await isReportNameUnique(mockPool, null as any);
      expect(result).toBe(false);
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('validateReportConfig', () => {
    let mockPool: any;

    beforeEach(() => {
      mockPool = {
        query: jest.fn()
      };
      mockPool.query.mockResolvedValue({ rows: [{ count: '0' }] });
    });

    it('should validate a complete valid report configuration', async () => {
      const config = {
        name: 'Daily Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com'],
        config: { format: 'csv' }
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', async () => {
      const config = {
        name: 'Daily Report',
        type: 'meter_readings'
        // Missing schedule and recipients
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('schedule'))).toBe(true);
      expect(result.errors.some(e => e.includes('Recipients'))).toBe(true);
    });

    it('should reject invalid email in recipients', async () => {
      const config = {
        name: 'Daily Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['invalid-email']
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid email'))).toBe(true);
    });

    it('should reject invalid cron expression', async () => {
      const config = {
        name: 'Daily Report',
        type: 'meter_readings',
        schedule: 'invalid-cron',
        recipients: ['user@example.com']
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('valid cron'))).toBe(true);
    });

    it('should reject duplicate report name', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '1' }] });

      const config = {
        name: 'Existing Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com']
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('already exists'))).toBe(true);
    });

    it('should reject empty recipients array', async () => {
      const config = {
        name: 'Daily Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: []
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('At least one recipient'))).toBe(true);
    });

    it('should reject non-string name', async () => {
      const config = {
        name: 123 as any,
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com']
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should reject name exceeding 255 characters', async () => {
      const config = {
        name: 'a'.repeat(256),
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com']
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('255 characters'))).toBe(true);
    });

    it('should exclude report ID when checking name uniqueness', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const config = {
        name: 'Report Name',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com']
      };

      await validateReportConfig(mockPool, config, 'report-id-123');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM reports WHERE name = $1 AND id != $2',
        ['Report Name', 'report-id-123']
      );
    });

    it('should allow optional config field', async () => {
      const config = {
        name: 'Daily Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com']
        // No config field
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(true);
    });

    it('should reject non-object config field', async () => {
      const config = {
        name: 'Daily Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com'],
        config: 'not-an-object' as any
      };

      const result = await validateReportConfig(mockPool, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('config'))).toBe(true);
    });
  });

  describe('validateRecipients', () => {
    it('should validate a list of valid recipients', () => {
      const result = validateRecipients(['user1@example.com', 'user2@example.com']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty recipients array', () => {
      const result = validateRecipients([]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('At least one recipient'))).toBe(true);
    });

    it('should reject invalid email in recipients', () => {
      const result = validateRecipients(['user@example.com', 'invalid-email']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid email'))).toBe(true);
    });

    it('should reject non-array input', () => {
      const result = validateRecipients('not-an-array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must be an array'))).toBe(true);
    });

    it('should identify all invalid emails', () => {
      const result = validateRecipients(['invalid1', 'valid@example.com', 'invalid2']);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('invalid1');
      expect(result.errors[0]).toContain('invalid2');
    });
  });
});
