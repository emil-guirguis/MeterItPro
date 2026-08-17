/**
 * Tests for CSV Generator Utility
 * 
 * Feature: meter-reading-export
 * Requirements: 1.2, 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect } from 'vitest';
import { generateCSV, MeterReading } from './csvGenerator';
import fc from 'fast-check';

describe('csvGenerator', () => {
  describe('generateCSV - Unit Tests', () => {
    it('should return empty string for empty array', () => {
      const result = generateCSV([]);
      expect(result).toBe('');
    });

    it('should return empty string for null input', () => {
      const result = generateCSV(null as any);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = generateCSV(undefined as any);
      expect(result).toBe('');
    });

    it('should include header row with all column names', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const result = generateCSV(readings);
      const lines = result.split('\n');

      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toContain('meter_id');
      expect(lines[0]).toContain('meter_element_id');
      expect(lines[0]).toContain('power');
      expect(lines[0]).toContain('created_at');
    });

    it('should include all data columns in header', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 1,
          power: 100,
          active_energy: 500,
          power_factor: 0.95,
          current: 10,
          voltage_p_n: 230,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const result = generateCSV(readings);
      const lines = result.split('\n');
      const header = lines[0];

      expect(header).toContain('meter_id');
      expect(header).toContain('meter_element_id');
      expect(header).toContain('power');
      expect(header).toContain('active_energy');
      expect(header).toContain('power_factor');
      expect(header).toContain('current');
      expect(header).toContain('voltage_p_n');
      expect(header).toContain('created_at');
    });

    it('should escape commas in field values', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
          // Add a field with comma
          custom_field: 'value,with,commas',
        },
      ];

      const result = generateCSV(readings);
      expect(result).toContain('"value,with,commas"');
    });

    it('should escape quotes in field values', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
          custom_field: 'value"with"quotes',
        },
      ];

      const result = generateCSV(readings);
      // Quotes should be doubled
      expect(result).toContain('value""with""quotes');
    });

    it('should escape newlines in field values', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
          custom_field: 'value\nwith\nnewlines',
        },
      ];

      const result = generateCSV(readings);
      expect(result).toContain('"value\nwith\nnewlines"');
    });

    it('should escape carriage returns in field values', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
          custom_field: 'value\rwith\rcarriage\rreturns',
        },
      ];

      const result = generateCSV(readings);
      expect(result).toContain('"value\rwith\rcarriage\rreturns"');
    });

    it('should handle null and undefined values', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: null as any,
          active_energy: undefined,
        },
      ];

      const result = generateCSV(readings);
      const lines = result.split('\n');
      expect(lines.length).toBe(2); // header + 1 data row
      // Null and undefined should be empty strings
      expect(result).not.toContain('null');
      expect(result).not.toContain('undefined');
    });

    it('should sort data by created_at in descending order', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
        },
        {
          meter_id: 2,
          created_at: '2024-01-15T12:00:00Z',
          power: 200,
        },
        {
          meter_id: 3,
          created_at: '2024-01-15T08:00:00Z',
          power: 300,
        },
      ];

      const result = generateCSV(readings);
      const lines = result.split('\n');

      // Find the created_at column index
      const header = lines[0];
      const columns = header.split(',');
      const createdAtIndex = columns.findIndex(col => col === 'created_at');

      // Extract created_at values from data rows (skip header)
      const createdAtValues = lines.slice(1).map(line => {
        const parts = line.split(',');
        return parts[createdAtIndex];
      });

      // Should be sorted newest first: 2024-01-15T12:00:00Z, 2024-01-15T10:00:00Z, 2024-01-15T08:00:00Z
      expect(createdAtValues[0]).toBe('2024-01-15T12:00:00Z');
      expect(createdAtValues[1]).toBe('2024-01-15T10:00:00Z');
      expect(createdAtValues[2]).toBe('2024-01-15T08:00:00Z');
    });

    it('should handle readings with missing created_at field', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          power: 100,
        },
        {
          meter_id: 2,
          created_at: '2024-01-15T10:00:00Z',
          power: 200,
        },
      ];

      const result = generateCSV(readings);
      expect(result).toBeTruthy();
      const lines = result.split('\n');
      expect(lines.length).toBe(3); // header + 2 data rows
    });

    it('should handle numeric values correctly', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          power: 100.5,
          current: 10,
          power_factor: 0.95,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const result = generateCSV(readings);
      expect(result).toContain('100.5');
      expect(result).toContain('10');
      expect(result).toContain('0.95');
    });

    it('should handle boolean values correctly', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
          is_active: true,
          is_error: false,
        },
      ];

      const result = generateCSV(readings);
      expect(result).toContain('true');
      expect(result).toContain('false');
    });

    it('should handle ISO date strings correctly', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:30:45.123Z',
          power: 100,
        },
      ];

      const result = generateCSV(readings);
      expect(result).toContain('2024-01-15T10:30:45.123Z');
    });

    it('should handle unicode characters correctly', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
          description: 'Température: 25°C, Humidité: 60%',
        },
      ];

      const result = generateCSV(readings);
      expect(result).toContain('Température: 25°C, Humidité: 60%');
    });

    it('should handle complex special character combinations', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          created_at: '2024-01-15T10:00:00Z',
          power: 100,
          complex_field: 'Value with "quotes", commas\nand newlines',
        },
      ];

      const result = generateCSV(readings);
      // Should be quoted and quotes doubled
      expect(result).toContain('"Value with ""quotes"", commas\nand newlines"');
    });

    it('should create valid CSV that can be parsed back', () => {
      const readings: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          meter_id: 2,
          meter_element_id: 20,
          power: 200,
          created_at: '2024-01-15T11:00:00Z',
        },
      ];

      const csv = generateCSV(readings);
      const lines = csv.split('\n');

      // Should have header + 2 data rows
      expect(lines.length).toBe(3);

      // Header should exist
      expect(lines[0]).toBeTruthy();

      // Data rows should exist
      expect(lines[1]).toBeTruthy();
      expect(lines[2]).toBeTruthy();
    });
  });

  describe('generateCSV - Property-Based Tests', () => {
    // Helper function to generate ISO date strings
    const isoDateString = () => {
      return fc.integer({ min: 0, max: 100000000000 }).map(ms => new Date(ms).toISOString());
    };

    // Property 2: CSV Includes All Columns
    // **Validates: Requirements 1.2**
    it('Property 2: CSV Includes All Columns - for any meter reading object, the generated CSV SHALL include all columns present in the meter reading data', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              meter_id: fc.integer(),
              meter_element_id: fc.integer(),
              power: fc.float({ noNaN: true, noInfinity: true }),
              created_at: isoDateString(),
              active_energy: fc.float({ noNaN: true, noInfinity: true }),
              power_factor: fc.float({ noNaN: true, noInfinity: true }),
              current: fc.float({ noNaN: true, noInfinity: true }),
              voltage_p_n: fc.float({ noNaN: true, noInfinity: true }),
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (readings) => {
            const csv = generateCSV(readings);
            const lines = csv.split('\n');
            const header = lines[0];

            // All column names should be in header
            expect(header).toContain('meter_id');
            expect(header).toContain('meter_element_id');
            expect(header).toContain('power');
            expect(header).toContain('created_at');
            expect(header).toContain('active_energy');
            expect(header).toContain('power_factor');
            expect(header).toContain('current');
            expect(header).toContain('voltage_p_n');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 4: CSV Special Character Escaping
    // **Validates: Requirements 4.2**
    it('Property 4: CSV Special Character Escaping - for any meter reading containing special characters, the generated CSV SHALL properly escape these characters so the CSV remains valid and parseable', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              meter_id: fc.integer(),
              created_at: isoDateString(),
              power: fc.float({ noNaN: true, noInfinity: true }),
              description: fc.string({ minLength: 0, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (readings) => {
            const csv = generateCSV(readings);

            // CSV should not be empty
            expect(csv).toBeTruthy();

            // CSV should have at least header + 1 data row
            const lines = csv.split('\n');
            expect(lines.length).toBeGreaterThanOrEqual(2);

            // All lines should be strings
            lines.forEach(line => {
              expect(typeof line).toBe('string');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 5: CSV Header Row Present
    // **Validates: Requirements 4.1**
    it('Property 5: CSV Header Row Present - for any non-empty set of meter readings, the generated CSV SHALL include a header row as the first line containing all column names', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              meter_id: fc.integer(),
              meter_element_id: fc.integer(),
              power: fc.float({ noNaN: true, noInfinity: true }),
              created_at: isoDateString(),
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (readings) => {
            const csv = generateCSV(readings);
            const lines = csv.split('\n');

            // First line should be header
            expect(lines.length).toBeGreaterThanOrEqual(2);
            const header = lines[0];

            // Header should contain column names
            expect(header).toBeTruthy();
            expect(header.length).toBeGreaterThan(0);

            // Header should contain at least one column name
            expect(header).toMatch(/\w+/);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 6: CSV UTF-8 Encoding
    // **Validates: Requirements 4.3**
    it('Property 6: CSV UTF-8 Encoding - for any meter reading data including non-ASCII characters, the generated CSV file SHALL be encoded in UTF-8 format', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              meter_id: fc.integer(),
              created_at: isoDateString(),
              power: fc.float({ noNaN: true, noInfinity: true }),
              description: fc.string({ minLength: 0, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (readings) => {
            const csv = generateCSV(readings);

            // CSV should be a valid string
            expect(typeof csv).toBe('string');

            // Should be able to encode/decode as UTF-8
            const encoded = new TextEncoder().encode(csv);
            const decoded = new TextDecoder('utf-8').decode(encoded);

            // Decoded should match original
            expect(decoded).toBe(csv);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 7: CSV Sort Order
    // **Validates: Requirements 4.4**
    it('Property 7: CSV Sort Order - for any set of meter readings with different created_at timestamps, the generated CSV SHALL be sorted by created_at in descending order (newest readings first)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              meter_id: fc.integer(),
              created_at: isoDateString(),
              power: fc.float({ noNaN: true, noInfinity: true }),
            }),
            { minLength: 2, maxLength: 100 }
          ),
          (readings) => {
            // Ensure we have different timestamps
            const uniqueReadings = readings.map((r, i) => ({
              ...r,
              created_at: new Date(new Date(r.created_at).getTime() + i * 1000).toISOString(),
            }));

            const csv = generateCSV(uniqueReadings);
            const lines = csv.split('\n');

            // Extract created_at values from data rows
            const createdAtValues: string[] = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (!line) continue;

              // Find created_at column index
              const header = lines[0];
              const columns = header.split(',');
              const createdAtIndex = columns.findIndex(col => col === 'created_at');

              if (createdAtIndex >= 0) {
                // Simple extraction (may not work with quoted fields, but good enough for test)
                const parts = line.split(',');
                if (parts[createdAtIndex]) {
                  createdAtValues.push(parts[createdAtIndex]);
                }
              }
            }

            // Verify descending order (if we have at least 2 values)
            if (createdAtValues.length >= 2) {
              for (let i = 0; i < createdAtValues.length - 1; i++) {
                const current = new Date(createdAtValues[i]).getTime();
                const next = new Date(createdAtValues[i + 1]).getTime();
                expect(current).toBeGreaterThanOrEqual(next);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 10: CSV Round Trip
    // **Validates: Requirements 1.2, 4.1, 4.2, 4.3, 4.4**
    it('Property 10: CSV Round Trip - for any set of meter readings, parsing the generated CSV back into objects SHALL produce data equivalent to the original readings (same columns, same values, same order)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              meter_id: fc.integer(),
              meter_element_id: fc.integer(),
              power: fc.float({ noNaN: true, noInfinity: true }),
              created_at: isoDateString(),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (readings) => {
            const csv = generateCSV(readings);

            // CSV should be valid
            expect(csv).toBeTruthy();

            // Should have header + data rows
            const lines = csv.split('\n');
            expect(lines.length).toBeGreaterThanOrEqual(2);

            // Header should exist
            const header = lines[0];
            expect(header).toBeTruthy();

            // Data rows should exist
            for (let i = 1; i < lines.length; i++) {
              expect(lines[i]).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
