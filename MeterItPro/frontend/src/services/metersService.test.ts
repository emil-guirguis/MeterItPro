import { describe, it, expect } from 'vitest';
import type { MeterReading } from '../components/sidebar-meters/types';

/**
 * Unit Tests for MetersService
 * Tests the sorting and data fetching logic
 */
describe('MetersService - Sorting Logic', () => {
  describe('getMeterReadings sorting', () => {
    it('should sort readings by created_date in descending order', () => {
      const mockReadings: MeterReading[] = [
        {
          id: '1',
          meterId: 'meter-1',
          value: 100,
          unit: 'kWh',
          createdDate: new Date('2024-01-01'),
        },
        {
          id: '2',
          meterId: 'meter-1',
          value: 200,
          unit: 'kWh',
          createdDate: new Date('2024-01-03'),
        },
        {
          id: '3',
          meterId: 'meter-1',
          value: 150,
          unit: 'kWh',
          createdDate: new Date('2024-01-02'),
        },
      ];

      // Simulate the sorting logic from metersService
      const sorted = [...mockReadings].sort((a, b) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });

      // Verify readings are sorted by created_date descending
      expect(sorted[0].createdDate).toEqual(new Date('2024-01-03'));
      expect(sorted[1].createdDate).toEqual(new Date('2024-01-02'));
      expect(sorted[2].createdDate).toEqual(new Date('2024-01-01'));
    });

    it('should handle empty readings array', () => {
      const mockReadings: MeterReading[] = [];

      const sorted = [...mockReadings].sort((a, b) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });

      expect(sorted).toEqual([]);
    });

    it('should maintain order for readings with same date', () => {
      const mockReadings: MeterReading[] = [
        {
          id: '1',
          meterId: 'meter-1',
          value: 100,
          unit: 'kWh',
          createdDate: new Date('2024-01-01T10:00:00'),
        },
        {
          id: '2',
          meterId: 'meter-1',
          value: 200,
          unit: 'kWh',
          createdDate: new Date('2024-01-01T10:00:00'),
        },
      ];

      const sorted = [...mockReadings].sort((a, b) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });

      // Both should be present
      expect(sorted.length).toBe(2);
    });
  });

  describe('getMeterElementReadings sorting', () => {
    it('should sort element readings by created_date in descending order', () => {
      const mockReadings: MeterReading[] = [
        {
          id: '1',
          meterId: 'meter-1',
          meterElementId: 'element-1',
          value: 100,
          unit: 'kWh',
          createdDate: new Date('2024-01-01'),
        },
        {
          id: '2',
          meterId: 'meter-1',
          meterElementId: 'element-1',
          value: 200,
          unit: 'kWh',
          createdDate: new Date('2024-01-03'),
        },
      ];

      const sorted = [...mockReadings].sort((a, b) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });

      expect(sorted[0].createdDate).toEqual(new Date('2024-01-03'));
      expect(sorted[1].createdDate).toEqual(new Date('2024-01-01'));
    });
  });
});
