/**
 * Tests for Email Subject Line Formatter Utility
 * 
 * Feature: meter-reading-export
 * Requirements: 2.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatEmailSubject } from './emailSubjectFormatter';

describe('emailSubjectFormatter', () => {
  describe('formatEmailSubject - Unit Tests', () => {
    it('should format subject with meter info and current date', () => {
      // Create a date in local timezone
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toBe('Meter Readings Export - Main Pump (2024-01-15)');
    });

    it('should use today\'s date when no date provided', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;
      
      const result = formatEmailSubject('Main Pump');
      
      expect(result).toContain(expectedDate);
      expect(result).toContain('Main Pump');
    });

    it('should include meter info in subject', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const result = formatEmailSubject('Building A - Floor 3', testDate);
      
      expect(result).toContain('Building A - Floor 3');
    });

    it('should format date with leading zeros', () => {
      const testDate = new Date(2024, 0, 5); // January 5, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toContain('2024-01-05');
    });

    it('should handle single digit month and day', () => {
      const testDate = new Date(2024, 2, 7); // March 7, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toContain('2024-03-07');
    });

    it('should handle double digit month and day', () => {
      const testDate = new Date(2024, 11, 25); // December 25, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toContain('2024-12-25');
    });

    it('should include "Meter Readings Export" prefix', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toContain('Meter Readings Export');
    });

    it('should handle meter info with special characters', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const result = formatEmailSubject('Main & Secondary Pump (Building A)', testDate);
      
      expect(result).toContain('Main & Secondary Pump (Building A)');
    });

    it('should handle meter info with unicode characters', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const result = formatEmailSubject('Température - 25°C', testDate);
      
      expect(result).toContain('Température - 25°C');
    });

    it('should handle empty meter info', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const result = formatEmailSubject('', testDate);
      
      expect(result).toBe('Meter Readings Export -  (2024-01-15)');
    });

    it('should handle very long meter info', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const longMeterInfo = 'A'.repeat(100);
      const result = formatEmailSubject(longMeterInfo, testDate);
      
      expect(result).toContain(longMeterInfo);
      expect(result).toContain('2024-01-15');
    });

    it('should format subject with consistent structure', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      // Check structure: "Meter Readings Export - {meterInfo} ({date})"
      expect(result).toMatch(/^Meter Readings Export - .+ \(\d{4}-\d{2}-\d{2}\)$/);
    });

    it('should handle leap year dates', () => {
      const testDate = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toContain('2024-02-29');
    });

    it('should handle year boundaries', () => {
      const testDate = new Date(2024, 11, 31); // December 31, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toContain('2024-12-31');
    });

    it('should handle new year date', () => {
      const testDate = new Date(2024, 0, 1); // January 1, 2024
      const result = formatEmailSubject('Main Pump', testDate);
      
      expect(result).toContain('2024-01-01');
    });
  });

  describe('formatEmailSubject - Property-Based Tests', () => {
    it('should always include meter info in subject', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(fc.string(), (meterInfo) => {
          const testDate = new Date(2024, 0, 15); // January 15, 2024
          const result = formatEmailSubject(meterInfo, testDate);
          
          // Subject should contain the meter info
          return result.includes(meterInfo);
        }),
        { numRuns: 50 }
      );
    });

    it('should always include date in YYYY-MM-DD format', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(fc.string(), (meterInfo) => {
          const testDate = new Date(2024, 0, 15); // January 15, 2024
          const result = formatEmailSubject(meterInfo, testDate);
          
          // Subject should contain the date in YYYY-MM-DD format
          return result.includes('2024-01-15');
        }),
        { numRuns: 50 }
      );
    });

    it('should always include "Meter Readings Export" prefix', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(fc.string(), (meterInfo) => {
          const testDate = new Date(2024, 0, 15); // January 15, 2024
          const result = formatEmailSubject(meterInfo, testDate);
          
          // Subject should start with "Meter Readings Export"
          return result.startsWith('Meter Readings Export');
        }),
        { numRuns: 50 }
      );
    });

    it('should format date correctly for any valid date', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 2000, max: 2100 }),
            fc.integer({ min: 0, max: 11 }),
            fc.integer({ min: 1, max: 28 }) // Use 1-28 to avoid month-specific issues
          ),
          ([year, month, day]) => {
            const date = new Date(year, month, day);
            const result = formatEmailSubject('Main Pump', date);
            
            // Extract the date from the result
            const dateMatch = result.match(/\((\d{4}-\d{2}-\d{2})\)$/);
            if (!dateMatch) return false;
            
            const formattedDate = dateMatch[1];
            
            // Verify the date format is correct
            const expectedMonth = String(month + 1).padStart(2, '0');
            const expectedDay = String(day).padStart(2, '0');
            const expectedDate = `${year}-${expectedMonth}-${expectedDay}`;
            
            return formattedDate === expectedDate;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain consistent format structure', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(
          fc.string(),
          fc.tuple(
            fc.integer({ min: 2000, max: 2100 }),
            fc.integer({ min: 0, max: 11 }),
            fc.integer({ min: 1, max: 28 })
          ),
          (meterInfo, [year, month, day]) => {
            const date = new Date(year, month, day);
            const result = formatEmailSubject(meterInfo, date);
            
            // Check structure: "Meter Readings Export - {meterInfo} ({date})"
            // Allow empty meter info by using .* instead of .+
            return /^Meter Readings Export - .* \(\d{4}-\d{2}-\d{2}\)$/.test(result);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should produce consistent results for same inputs', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(
          fc.string(),
          fc.tuple(
            fc.integer({ min: 2000, max: 2100 }),
            fc.integer({ min: 0, max: 11 }),
            fc.integer({ min: 1, max: 28 })
          ),
          (meterInfo, [year, month, day]) => {
            const date = new Date(year, month, day);
            const result1 = formatEmailSubject(meterInfo, date);
            const result2 = formatEmailSubject(meterInfo, date);
            
            // Same inputs should produce same output
            return result1 === result2;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should produce different results for different meter info', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(
          fc.tuple(fc.string(), fc.string()).filter(([a, b]) => a !== b),
          ([meterInfo1, meterInfo2]) => {
            const testDate = new Date(2024, 0, 15); // January 15, 2024
            const result1 = formatEmailSubject(meterInfo1, testDate);
            const result2 = formatEmailSubject(meterInfo2, testDate);
            
            // Different meter info should produce different results
            return result1 !== result2;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should produce different results for different dates', () => {
      // **Validates: Requirements 2.4**
      fc.assert(
        fc.property(
          fc.tuple(
            fc.tuple(
              fc.integer({ min: 2000, max: 2100 }),
              fc.integer({ min: 0, max: 11 }),
              fc.integer({ min: 1, max: 28 })
            ),
            fc.tuple(
              fc.integer({ min: 2000, max: 2100 }),
              fc.integer({ min: 0, max: 11 }),
              fc.integer({ min: 1, max: 28 })
            )
          ).filter(([[y1, m1, d1], [y2, m2, d2]]) => {
            // Ensure dates are different
            return y1 !== y2 || m1 !== m2 || d1 !== d2;
          }),
          ([[y1, m1, d1], [y2, m2, d2]]) => {
            const date1 = new Date(y1, m1, d1);
            const date2 = new Date(y2, m2, d2);
            const result1 = formatEmailSubject('Main Pump', date1);
            const result2 = formatEmailSubject('Main Pump', date2);
            
            // Different dates should produce different results
            return result1 !== result2;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
