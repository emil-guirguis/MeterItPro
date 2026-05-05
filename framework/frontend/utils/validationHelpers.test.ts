import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateCronExpression,
  validateReportName,
  validateEmailList,
} from './validationHelpers';

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user+tag@sub.domain.org')).toBe(true);
    expect(validateEmail('x@y.z')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('rejects leading/trailing whitespace', () => {
    expect(validateEmail(' user@example.com')).toBe(false);
    expect(validateEmail('user@example.com ')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validateCronExpression', () => {
  it('accepts wildcard expression', () => {
    expect(validateCronExpression('* * * * *')).toBe(true);
  });

  it('accepts specific values in all fields', () => {
    expect(validateCronExpression('0 12 1 1 0')).toBe(true);
  });

  it('accepts range expressions', () => {
    expect(validateCronExpression('0-30 8-17 * * 1-5')).toBe(true);
  });

  it('accepts step expressions', () => {
    expect(validateCronExpression('*/15 * * * *')).toBe(true);
    expect(validateCronExpression('0 */2 * * *')).toBe(true);
  });

  it('accepts comma-list expressions', () => {
    expect(validateCronExpression('0,30 8,12,17 * * *')).toBe(true);
  });

  it('rejects fewer than 5 parts', () => {
    expect(validateCronExpression('* * * *')).toBe(false);
  });

  it('rejects more than 5 parts', () => {
    expect(validateCronExpression('* * * * * *')).toBe(false);
  });

  it('rejects minute out of range', () => {
    expect(validateCronExpression('60 * * * *')).toBe(false);
  });

  it('rejects hour out of range', () => {
    expect(validateCronExpression('0 24 * * *')).toBe(false);
  });

  it('rejects day out of range', () => {
    expect(validateCronExpression('0 0 0 * *')).toBe(false);
    expect(validateCronExpression('0 0 32 * *')).toBe(false);
  });

  it('rejects month out of range', () => {
    expect(validateCronExpression('0 0 1 0 *')).toBe(false);
    expect(validateCronExpression('0 0 1 13 *')).toBe(false);
  });

  it('rejects day-of-week out of range', () => {
    expect(validateCronExpression('0 0 * * 7')).toBe(false);
  });

  it('rejects invalid range (start > end)', () => {
    expect(validateCronExpression('30-0 * * * *')).toBe(false);
  });

  it('rejects step of zero', () => {
    expect(validateCronExpression('*/0 * * * *')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateCronExpression('')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(validateCronExpression(null as any)).toBe(false);
  });
});

describe('validateReportName', () => {
  it('accepts valid names', () => {
    expect(validateReportName('Monthly Report')).toBe(true);
    expect(validateReportName('a')).toBe(true);
    expect(validateReportName('x'.repeat(255))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateReportName('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(validateReportName('   ')).toBe(false);
  });

  it('rejects names longer than 255 chars', () => {
    expect(validateReportName('x'.repeat(256))).toBe(false);
  });

  it('rejects non-string', () => {
    expect(validateReportName(null as any)).toBe(false);
  });
});

describe('validateEmailList', () => {
  it('accepts list of valid emails', () => {
    expect(validateEmailList(['a@b.com', 'c@d.org'])).toBe(true);
  });

  it('accepts single valid email', () => {
    expect(validateEmailList(['user@example.com'])).toBe(true);
  });

  it('rejects empty array', () => {
    expect(validateEmailList([])).toBe(false);
  });

  it('rejects list with one invalid email', () => {
    expect(validateEmailList(['valid@email.com', 'notanemail'])).toBe(false);
  });

  it('rejects non-array', () => {
    expect(validateEmailList(null as any)).toBe(false);
  });
});
