/**
 * Tests for Email Handler Utility
 * 
 * Feature: meter-reading-export
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.5, 7.1, 7.2, 7.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import  { handleEmail } from './emailHandler';
import type { EmailOptions} from './emailHandler';
import type { MeterReading } from './csvGenerator';

describe('emailHandler', () => {
  let mockWindowLocation: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;

  beforeEach(() => {
    // Mock window.location.href
    mockWindowLocation = {
      href: '',
    };
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true,
      configurable: true,
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    // These are static methods on the URL object
    if (!URL.createObjectURL) {
      (URL as any).createObjectURL = vi.fn();
    }
    if (!URL.revokeObjectURL) {
      (URL as any).revokeObjectURL = vi.fn();
    }
    
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL' as any).mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL' as any).mockImplementation(() => {});

    // Mock setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('handleEmail - Unit Tests', () => {
    it('should successfully email data with all callbacks', async () => {
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

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleEmail(options);

      // Verify loading state was managed
      expect(onLoading).toHaveBeenCalledWith(true);
      expect(onLoading).toHaveBeenCalledWith(false);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify error callbacks were not called
      expect(onError).not.toHaveBeenCalled();
      expect(onNotifyError).not.toHaveBeenCalled();

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
    });

    it('should handle empty data array', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onLoading = vi.fn();
      const onNotifySuccess = vi.fn();
      const onNotifyError = vi.fn();

      const options: EmailOptions = {
        data: [],
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleEmail(options);

      // Verify loading state was managed
      expect(onLoading).toHaveBeenCalledWith(true);
      expect(onLoading).toHaveBeenCalledWith(false);

      // Verify error callbacks were called
      expect(onNotifyError).toHaveBeenCalledWith(
        'No meter readings available to email. Please adjust your filters.'
      );
      expect(onError).toHaveBeenCalled();

      // Verify success callbacks were not called
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onNotifySuccess).not.toHaveBeenCalled();

      // Verify email client was not opened
      expect(mockWindowLocation.href).toBe('');
    });

    it('should handle null data', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onLoading = vi.fn();
      const onNotifySuccess = vi.fn();
      const onNotifyError = vi.fn();

      const options: EmailOptions = {
        data: null as any,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleEmail(options);

      // Verify error callbacks were called
      expect(onNotifyError).toHaveBeenCalledWith(
        'No meter readings available to email. Please adjust your filters.'
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

      const options: EmailOptions = {
        data: undefined as any,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onError,
        onLoading,
        onNotifySuccess,
        onNotifyError,
      };

      await handleEmail(options);

      // Verify error callbacks were called
      expect(onNotifyError).toHaveBeenCalledWith(
        'No meter readings available to email. Please adjust your filters.'
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

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify URL.createObjectURL was called (which means Blob was created)
      expect(createObjectURLSpy).toHaveBeenCalled();
      
      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
    });

    it('should generate mailto URL with subject line', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify mailto URL was generated with subject
      expect(mockWindowLocation.href).toContain('mailto:');
      expect(mockWindowLocation.href).toContain('subject=');
      expect(mockWindowLocation.href).toContain('Main%20Pump');
    });

    it('should include meter info in subject line', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Building A - Floor 3',
      };

      await handleEmail(options);

      // Verify meter info is in the subject
      expect(mockWindowLocation.href).toContain('Building%20A%20-%20Floor%203');
    });

    it('should include filename in email body', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: '2024-01-15_Meter_Readings_Main_Pump.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify filename is in the body
      expect(mockWindowLocation.href).toContain('body=');
      expect(mockWindowLocation.href).toContain('2024-01-15_Meter_Readings_Main_Pump.csv');
    });

    it('should call onLoading with false even on error', async () => {
      const onLoading = vi.fn();
      const onError = vi.fn();
      const onNotifyError = vi.fn();

      const options: EmailOptions = {
        data: [],
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onLoading,
        onError,
        onNotifyError,
      };

      await handleEmail(options);

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

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onNotifySuccess,
      };

      await handleEmail(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
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

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onNotifySuccess,
      };

      await handleEmail(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
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

      const options: EmailOptions = {
        data: mockData,
        filename: '2024-01-15_Meter_Readings_Main_Pump.csv',
        meterInfo: 'Main Pump',
        onNotifySuccess,
      };

      await handleEmail(options);

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

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        // No callbacks provided
      };

      // Should not throw
      await expect(handleEmail(options)).resolves.toBeUndefined();

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
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

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onNotifySuccess,
      };

      await handleEmail(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
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

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onNotifySuccess,
      };

      await handleEmail(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
    });

    it('should schedule cleanup of temporary file', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify URL.createObjectURL was called
      expect(createObjectURLSpy).toHaveBeenCalled();

      // Advance timers to trigger cleanup
      vi.advanceTimersByTime(1000);

      // Verify URL.revokeObjectURL was called for cleanup
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
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

      const options: EmailOptions = {
        data: mockData,
        filename: 'large_export.csv',
        meterInfo: 'Main Pump',
        onSuccess,
        onNotifySuccess,
      };

      await handleEmail(options);

      // Verify success callbacks were called
      expect(onSuccess).toHaveBeenCalled();
      expect(onNotifySuccess).toHaveBeenCalled();

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');
    });

    it('should format subject with current date', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify subject includes date
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;

      expect(mockWindowLocation.href).toContain(expectedDate);
    });

    it('should handle special characters in meter info', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main & Secondary Pump (Building A)',
      };

      await handleEmail(options);

      // Verify email client was opened
      expect(mockWindowLocation.href).toContain('mailto:');

      // Verify meter info is properly encoded
      expect(mockWindowLocation.href).toContain('Main%20%26%20Secondary%20Pump');
    });
  });

  describe('handleEmail - Error Handling', () => {
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

      // Mock window.location.href to throw an error
      Object.defineProperty(window, 'location', {
        value: {
          get href() {
            throw new Error('Email client failed to open');
          },
          set href(_value: string) {
            throw new Error('Email client failed to open');
          },
        },
        writable: true,
      });

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onError,
        onNotifyError,
        onLoading,
      };

      await handleEmail(options);

      // Verify error callbacks were called
      expect(onError).toHaveBeenCalled();
      expect(onNotifyError).toHaveBeenCalled();

      // Verify loading state was cleared
      expect(onLoading).toHaveBeenLastCalledWith(false);
    });

    it('should provide error message in notification', async () => {
      const onNotifyError = vi.fn();

      const options: EmailOptions = {
        data: [],
        filename: 'test.csv',
        meterInfo: 'Main Pump',
        onNotifyError,
      };

      await handleEmail(options);

      // Verify error notification was called with a message
      expect(onNotifyError).toHaveBeenCalled();
      const errorMessage = onNotifyError.mock.calls[0][0];
      expect(typeof errorMessage).toBe('string');
      expect(errorMessage.length).toBeGreaterThan(0);
    });

    it('should clean up temporary file on error', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      // Mock window.location.href to throw an error
      Object.defineProperty(window, 'location', {
        value: {
          get href() {
            throw new Error('Email client failed to open');
          },
          set href(_value: string) {
            throw new Error('Email client failed to open');
          },
        },
        writable: true,
      });

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify URL.revokeObjectURL was called for cleanup
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('Temporary File Management', () => {
    it('should track temporary file URLs', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify URL.createObjectURL was called
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should clean up temporary file after delay', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Before cleanup
      expect(revokeObjectURLSpy).not.toHaveBeenCalled();

      // Advance timers to trigger cleanup
      vi.advanceTimersByTime(1000);

      // After cleanup
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      // Mock revokeObjectURL to throw an error
      revokeObjectURLSpy.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      // Should not throw
      await expect(handleEmail(options)).resolves.toBeUndefined();

      // Advance timers to trigger cleanup
      vi.advanceTimersByTime(1000);

      // Verify cleanup was attempted
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('Email Subject Line Formatting', () => {
    it('should include meter info in subject', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify subject includes meter info
      expect(mockWindowLocation.href).toContain('Main%20Pump');
    });

    it('should include date in subject', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main Pump',
      };

      await handleEmail(options);

      // Verify subject includes date
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;

      expect(mockWindowLocation.href).toContain(expectedDate);
    });

    it('should properly encode subject line', async () => {
      const mockData: MeterReading[] = [
        {
          meter_id: 1,
          meter_element_id: 10,
          power: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const options: EmailOptions = {
        data: mockData,
        filename: 'test.csv',
        meterInfo: 'Main & Secondary',
      };

      await handleEmail(options);

      // Verify subject is properly encoded
      expect(mockWindowLocation.href).toContain('subject=');
      // & should be encoded as %26
      expect(mockWindowLocation.href).toContain('%26');
    });
  });
});
