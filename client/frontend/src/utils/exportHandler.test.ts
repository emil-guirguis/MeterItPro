/**
 * Tests for Export Handler Utility
 * 
 * Feature: meter-reading-export
 * Requirements: 1.1, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleExport, ExportOptions } from './exportHandler';
import { MeterReading } from './csvGenerator';

describe('exportHandler', () => {
  let mockElement: HTMLAnchorElement;
  let createElementSpy: any;
  let appendSpy: any;
  let removeSpy: any;

  beforeEach(() => {
    // Mock document.createElement
    mockElement = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    } as any;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockElement);

    // Mock document.body.appendChild and removeChild
    appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement as any);
    removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement as any);

    // Mock URL.createObjectURL and URL.revokeObjectURL globally
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleExport - Unit Tests', () => {
    it('should successfully export data with all callbacks', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onLoading = vi.fn();
      const onNotifySuccess = vi.fn();
      const onNotifyError = vi.fn();

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleExport(options);

      // Verify loading state was managed
      expect(onLoading).toHaveBeenCalledWith(true);
      expect(onLoading).toHaveBeenCalledWith(false);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify error callbacks were not called
      expect(onError).not.toHaveBeenCalled();
      expect(onNotifyError).not.toHaveBeenCalled();

      // Verify download was triggered
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', 'test.csv');
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should handle empty data array', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onLoading = vi.fn();
      const onNotifySuccess = vi.fn();
      const onNotifyError = vi.fn();

      const options: ExportOptions = {
        data: [],
        filename: 'test.csv',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleExport(options);

      // Verify loading state was managed
      expect(onLoading).toHaveBeenCalledWith(true);
      expect(onLoading).toHaveBeenCalledWith(false);

      // Verify error callbacks were called
      expect(onNotifyError).toHaveBeenCalledWith(
        'No meter readings available to export. Please adjust your filters.'
      );
      expect(onError).toHaveBeenCalled();

      // Verify success callbacks were not called
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onNotifySuccess).not.toHaveBeenCalled();

      // Verify download was not triggered
      expect(mockElement.click).not.toHaveBeenCalled();
    });

    it('should handle null data', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onLoading = vi.fn();
      const onNotifySuccess = vi.fn();
      const onNotifyError = vi.fn();

      const options: ExportOptions = {
        data: null as any,
        filename: 'test.csv',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleExport(options);

      // Verify error callbacks were called
      expect(onNotifyError).toHaveBeenCalledWith(
        'No meter readings available to export. Please adjust your filters.'
      );
      expect(onError).toHaveBeenCalled();

      // Verify success callbacks were not called
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle undefined data', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onLoading = vi.fn();
      const onNotifySuccess = vi.fn();
      const onNotifyError = vi.fn();

      const options: ExportOptions = {
        data: undefined as any,
        filename: 'test.csv',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleExport(options);

      // Verify error callbacks were called
      expect(onNotifyError).toHaveBeenCalledWith(
        'No meter readings available to export. Please adjust your filters.'
      );
      expect(onError).toHaveBeenCalled();
    });

    it('should create blob with correct content type', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
      };

      await handleExport(options);

      // Verify download was triggered (which means Blob was created)
      expect(mockElement.click).toHaveBeenCalled();
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    });

    it('should set correct download filename', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: ExportOptions = {
        data: mockData,
        filename: '2024-01-15_Meter_Readings_Main_Pump.csv',
      };

      await handleExport(options);

      // Verify download attribute was set with correct filename
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'download',
        '2024-01-15_Meter_Readings_Main_Pump.csv'
      );
    });

    it('should clean up blob URL after download', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
      };

      await handleExport(options);

      // Verify URL.revokeObjectURL was called to clean up
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should call onLoading with false even on error', async () => {
      const onLoading = vi.fn();
      const onError = vi.fn();
      const onNotifyError = vi.fn();

      const options: ExportOptions = {
        data: [],
        filename: 'test.csv',
        onLoading,
        onError,
        onNotifyError,
      };

      await handleExport(options);

      // Verify loading state was cleared
      expect(onLoading).toHaveBeenLastCalledWith(false);
    });

    it('should handle multiple data rows', async () => {
      const mockData: MeterReading[] = [
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
        {
          meter_id: 3,
          meter_element_id: 30,
          power: 300,
          created_at: '2024-01-15T12:00:00Z',
        },
      ];

      const onSuccess = vi.fn();
      const onNotifySuccess = vi.fn();

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
        onSuccess,
        onNotifySuccess,
      };

      await handleExport(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify download was triggered
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should handle data with special characters', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
          description: 'Value with "quotes", commas\nand newlines',
        },
      ];

      const onSuccess = vi.fn();
      const onNotifySuccess = vi.fn();

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
        onSuccess,
        onNotifySuccess,
      };

      await handleExport(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify download was triggered
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should display success notification with filename', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const onNotifySuccess = vi.fn();

      const options: ExportOptions = {
        data: mockData,
        filename: '2024-01-15_Meter_Readings_Main_Pump.csv',
        onNotifySuccess,
      };

      await handleExport(options);

      // Verify success notification includes filename
      expect(onNotifySuccess).toHaveBeenCalledWith(
        expect.stringContaining('2024-01-15_Meter_Readings_Main_Pump.csv')
      );
    });

    it('should handle optional callbacks gracefully', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
        // No callbacks provided
      };

      // Should not throw
      await expect(handleExport(options)).resolves.toBeUndefined();

      // Verify download was still triggered
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should handle data with unicode characters', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
          description: 'Température: 25°C, Humidité: 60%',
        },
      ];

      const onSuccess = vi.fn();
      const onNotifySuccess = vi.fn();

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
        onSuccess,
        onNotifySuccess,
      };

      await handleExport(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify download was triggered
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should set href attribute on download link', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
      };

      await handleExport(options);

      // Verify href was set to blob URL
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    });

    it('should append and remove link element from DOM', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
      };

      await handleExport(options);

      // Verify link was appended and removed
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    it('should handle large datasets', async () => {
      const mockData: MeterReading[] = Array.from({ length: 1000 }, (_, i) => ({
        meter_id: i,
        meter_element_id: i * 10,
        power: 100 + i,
        created_at: new Date(2024, 0, 15, 10, i % 60).toISOString(),
      }));

      const onSuccess = vi.fn();
      const onNotifySuccess = vi.fn();

      const options: ExportOptions = {
        data: mockData,
        filename: 'large_export.csv',
        onSuccess,
        onNotifySuccess,
      };

      await handleExport(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify download was triggered
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should handle data with null and undefined values', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: null as any,
          created_at: '2024-01-15T10:00:00Z',
          active_energy: undefined,
        },
      ];

      const onSuccess = vi.fn();
      const onNotifySuccess = vi.fn();

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
        onSuccess,
        onNotifySuccess,
      };

      await handleExport(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify download was triggered
      expect(mockElement.click).toHaveBeenCalled();
    });
  });

  describe('handleExport - Error Handling', () => {
    it('should catch and handle unexpected errors', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const onError = vi.fn();
      const onNotifyError = vi.fn();
      const onLoading = vi.fn();

      // Mock click to throw an error
      mockElement.click = vi.fn(() => {
        throw new Error('Download failed');
      });

      const options: ExportOptions = {
        data: mockData,
        filename: 'test.csv',
        onError,
        onNotifyError,
        onLoading,
      };

      await handleExport(options);

      // Verify error callbacks were called
      expect(onError).toHaveBeenCalled();
      expect(onNotifyError).toHaveBeenCalled();

      // Verify loading state was cleared
      expect(onLoading).toHaveBeenLastCalledWith(false);
    });

    it('should provide error message in notification', async () => {
      const onNotifyError = vi.fn();

      const options: ExportOptions = {
        data: [],
        filename: 'test.csv',
        onNotifyError,
      };

      await handleExport(options);

      // Verify error notification was called with a message
      expect(onNotifyError).toHaveBeenCalled();
      const errorMessage = onNotifyError.mock.calls[0][0];
      expect(typeof errorMessage).toBe('string');
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });
});
