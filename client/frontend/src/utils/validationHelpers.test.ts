import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateCronExpression,
  validateReportName,
  validateEmailList
} from '@framework/utils/validationHelpers';

describe('validationHelpers', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@example.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true);
      expect(validateEmail('user@localhost')).toBe(false); // No TLD
    });
  });

  describe('validateCronExpression', () => {
    it('should validate correct cron expressions', () => {
      expect(validateCronExpression('0 9 * * *')).toBe(true); // Daily at 9 AM
      expect(validateCronExpression('0 9 * * 1')).toBe(true); // Weekly on Monday
      expect(validateCronExpression('0 9 1 * *')).toBe(true); // Monthly on 1st
      expect(validateCronExpression('*/15 * * * *')).toBe(true); // Every 15 minutes
      expect(validateCronExpression('0 0 * * 0')).toBe(true); // Weekly on Sunday
    });

    it('should validate cron with ranges', () => {
      expect(validateCronExpression('0 9-17 * * *')).toBe(true); // 9 AM to 5 PM
      expect(validateCronExpression('0 0 1-15 * *')).toBe(true); // First 15 days
    });

    it('should validate cron with lists', () => {
      expect(validateCronExpression('0 9,12,15 * * *')).toBe(true); // Multiple hours
      expect(validateCronExpression('0 0 * * 1,3,5')).toBe(true); // Mon, Wed, Fri
    });

    it('should validate cron with step values', () => {
      expect(validateCronExpression('*/5 * * * *')).toBe(true); // Every 5 minutes
      expect(validateCronExpression('0 */2 * * *')).toBe(true); // Every 2 hours
    });

    it('should reject invalid cron expressions', () => {
      expect(validateCronExpression('0 9 * *')).toBe(false); // Too few fields
      expect(validateCronExpression('0 9 * * * *')).toBe(false); // Too many fields
      expect(validateCronExpression('60 9 * * *')).toBe(false); // Invalid minute
      expect(validateCronExpression('0 24 * * *')).toBe(false); // Invalid hour
      expect(validateCronExpression('0 9 32 * *')).toBe(false); // Invalid day
      expect(validateCronExpression('0 9 * 13 *')).toBe(false); // Invalid month
      expect(validateCronExpression('0 9 * * 7')).toBe(false); // Invalid day of week
    });

    it('should reject invalid range expressions', () => {
      expect(validateCronExpression('0 17-9 * * *')).toBe(false); // Start > end
      expect(validateCronExpression('0 9-25 * * *')).toBe(false); // End out of range
    });

    it('should handle edge cases', () => {
      expect(validateCronExpression('')).toBe(false);
      expect(validateCronExpression('   ')).toBe(false);
      expect(validateCronExpression(null as any)).toBe(false);
      expect(validateCronExpression(undefined as any)).toBe(false);
    });
  });

  describe('validateReportName', () => {
    it('should validate correct report names', () => {
      expect(validateReportName('Monthly Report')).toBe(true);
      expect(validateReportName('Daily Usage Summary')).toBe(true);
      expect(validateReportName('a')).toBe(true);
    });

    it('should reject invalid report names', () => {
      expect(validateReportName('')).toBe(false);
      expect(validateReportName('   ')).toBe(false);
      expect(validateReportName(null as any)).toBe(false);
      expect(validateReportName(undefined as any)).toBe(false);
    });

    it('should reject names exceeding max length', () => {
      const longName = 'a'.repeat(256);
      expect(validateReportName(longName)).toBe(false);
    });

    it('should accept names at max length', () => {
      const maxName = 'a'.repeat(255);
      expect(validateReportName(maxName)).toBe(true);
    });
  });

  describe('validateEmailList', () => {
    it('should validate correct email lists', () => {
      expect(validateEmailList(['user@example.com'])).toBe(true);
      expect(validateEmailList(['user1@example.com', 'user2@example.com'])).toBe(true);
    });

    it('should reject invalid email lists', () => {
      expect(validateEmailList([])).toBe(false);
      expect(validateEmailList(['invalid'])).toBe(false);
      expect(validateEmailList(['user@example.com', 'invalid'])).toBe(false);
    });

    it('should reject non-array inputs', () => {
      expect(validateEmailList(null as any)).toBe(false);
      expect(validateEmailList(undefined as any)).toBe(false);
      expect(validateEmailList('user@example.com' as any)).toBe(false);
    });
  });
});
