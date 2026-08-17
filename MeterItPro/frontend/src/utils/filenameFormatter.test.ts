/**
 * Tests for Filename Formatter Utility
 * 
 * Feature: meter-reading-export
 * Requirements: 1.3
 */

import { describe, it, expect } from 'vitest';
import { formatExportFilename } from './filenameFormatter';
import fc from 'fast-check';

describe('filenameFormatter', () => {
  describe('formatExportFilename - Unit Tests', () => {
    it('should format filename with basic element name', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024 in local time
      const result = formatExportFilename('Main Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should format filename with today\'s date when no date provided', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;

      const result = formatExportFilename('Test Element');
      expect(result).toContain(expectedDate);
      expect(result).toContain('_Meter_Readings_Test_Element.csv');
    });

    it('should handle element names with spaces', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Building A Main Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Building_A_Main_Pump.csv');
    });

    it('should remove special characters from element name', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main<Pump>', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with forward slashes', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Building/Floor/Room', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Building_Floor_Room.csv');
    });

    it('should handle element names with backslashes', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Building\\Floor\\Room', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Building_Floor_Room.csv');
    });

    it('should handle element names with colons', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Meter:Main:Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Meter_Main_Pump.csv');
    });

    it('should handle element names with quotes', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main"Pump"', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with pipes', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main|Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with question marks', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main?Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with asterisks', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main*Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with multiple consecutive special characters', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main<<<>>>Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with multiple consecutive underscores', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main___Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle empty element name', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Unknown.csv');
    });

    it('should handle element name with only special characters', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('<<<>>>', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Unknown.csv');
    });

    it('should format date correctly with single digit month', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      const result = formatExportFilename('Test', date);
      expect(result).toContain('2024-01-05');
    });

    it('should format date correctly with single digit day', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Test', date);
      expect(result).toContain('2024-01-15');
    });

    it('should format date correctly with double digit month and day', () => {
      const date = new Date(2024, 11, 25); // December 25, 2024
      const result = formatExportFilename('Test', date);
      expect(result).toContain('2024-12-25');
    });

    it('should always end with .csv extension', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Test Element', date);
      expect(result).toMatch(/\.csv$/);
    });

    it('should always include _Meter_Readings_ in filename', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Test Element', date);
      expect(result).toContain('_Meter_Readings_');
    });

    it('should handle element names with numbers', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Pump123', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Pump123.csv');
    });

    it('should handle element names with hyphens', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main-Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main-Pump.csv');
    });

    it('should handle element names with dots', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main.Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main.Pump.csv');
    });

    it('should handle element names with unicode characters', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Température', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Température.csv');
    });

    it('should handle element names with leading/trailing spaces', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('  Main Pump  ', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with leading/trailing special characters', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('<<<Main Pump>>>', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle null date by using today', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;

      const result = formatExportFilename('Test', null as any);
      expect(result).toContain(expectedDate);
    });

    it('should handle undefined date by using today', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;

      const result = formatExportFilename('Test', undefined);
      expect(result).toContain(expectedDate);
    });

    it('should handle element names with control characters', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main\x00Pump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with newlines', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main\nPump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle element names with tabs', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('Main\tPump', date);
      expect(result).toBe('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should handle very long element names', () => {
      const date = new Date(2024, 0, 15);
      const longName = 'A'.repeat(200);
      const result = formatExportFilename(longName, date);
      expect(result).toContain('_Meter_Readings_');
      expect(result).toMatch(/\.csv$/);
      expect(result).toContain('A'.repeat(200));
    });

    it('should handle element names with mixed case', () => {
      const date = new Date(2024, 0, 15);
      const result = formatExportFilename('MaIn PuMp', date);
      expect(result).toBe('2024-01-15_Meter_Readings_MaIn_PuMp.csv');
    });
  });

  describe('formatExportFilename - Property-Based Tests', () => {
    // Property 3: Filename Format Correctness
    // **Validates: Requirements 1.3**
    it('Property 3: Filename Format Correctness - for any element name and current date, the generated filename SHALL match the pattern [YYYY-MM-DD]_Meter_Readings_[elementName].csv where the date is today\'s date and element name is properly formatted', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
          (elementName, date) => {
            const result = formatExportFilename(elementName, date);

            // Should end with .csv
            expect(result).toMatch(/\.csv$/);

            // Should contain _Meter_Readings_
            expect(result).toContain('_Meter_Readings_');

            // Should match pattern: [YYYY-MM-DD]_Meter_Readings_[elementName].csv
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}_Meter_Readings_.*\.csv$/);

            // Should not contain invalid filename characters
            expect(result).not.toMatch(/[<>:"|?*\x00-\x1f]/);

            // Should be a valid string
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Additional property test: Filename is filesystem-safe
    it('Property 3b: Filename Filesystem Safety - for any element name, the generated filename SHALL not contain any characters that are invalid in filenames on Windows, macOS, or Linux', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (elementName) => {
            const result = formatExportFilename(elementName, new Date(2024, 0, 15));

            // Should not contain Windows invalid characters: < > : " / \ | ? *
            expect(result).not.toMatch(/[<>:"/\\|?*]/);

            // Should not contain null character
            expect(result).not.toContain('\x00');

            // Should not contain control characters
            expect(result).not.toMatch(/[\x00-\x1f]/);

            // Should be a valid filename
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Additional property test: Date format consistency
    it('Property 3c: Date Format Consistency - for any date, the generated filename SHALL have the date formatted as YYYY-MM-DD with zero-padded month and day', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
          (date) => {
            const result = formatExportFilename('Test', date);

            // Extract date part from filename
            const dateMatch = result.match(/^(\d{4})-(\d{2})-(\d{2})/);
            expect(dateMatch).toBeTruthy();

            if (dateMatch) {
              const [, year, month, day] = dateMatch;

              // Verify month and day are zero-padded
              expect(month).toMatch(/^\d{2}$/);
              expect(day).toMatch(/^\d{2}$/);
              expect(parseInt(month)).toBeGreaterThanOrEqual(1);
              expect(parseInt(month)).toBeLessThanOrEqual(12);
              expect(parseInt(day)).toBeGreaterThanOrEqual(1);
              expect(parseInt(day)).toBeLessThanOrEqual(31);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
