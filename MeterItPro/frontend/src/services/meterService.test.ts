import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { meterService, type Meter, type VirtualMeterConfig } from './meterService';

// Mock apiClient
vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import apiClient from './apiClient';

describe('MeterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Disable retries for testing
    (globalThis as any).__DISABLE_RETRIES__ = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Re-enable retries
    (globalThis as any).__DISABLE_RETRIES__ = false;
  });

  describe('getMeterElements', () => {
    it('should fetch available meters without filters', async () => {
      const mockMeters: Meter[] = [
        { id: '1', name: 'Meter 1', identifier: 'M-001', type: 'physical' },
        { id: '2', name: 'Meter 2', identifier: 'M-002', type: 'physical' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockMeters },
      } as any);

      const result = await meterService.getMeterElements();

      expect(result).toEqual(mockMeters);
      expect(apiClient.get).toHaveBeenCalledWith('/meters/elements', { params: {} });
    });

    it('should fetch meters with type filter', async () => {
      const mockMeters: Meter[] = [
        { id: '1', name: 'Meter 1', identifier: 'M-001', type: 'physical' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockMeters },
      } as any);

      const result = await meterService.getMeterElements({ type: 'physical' });

      expect(result).toEqual(mockMeters);
      expect(apiClient.get).toHaveBeenCalledWith('/meters/elements', {
        params: { type: 'physical' },
      });
    });

    it('should fetch meters with excludeIds filter', async () => {
      const mockMeters: Meter[] = [
        { id: '2', name: 'Meter 2', identifier: 'M-002', type: 'physical' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockMeters },
      } as any);

      const result = await meterService.getMeterElements({ excludeIds: '1,3' });

      expect(result).toEqual(mockMeters);
      expect(apiClient.get).toHaveBeenCalledWith('/meters/elements', {
        params: { excludeIds: '1,3' },
      });
    });

    it('should fetch meters with searchQuery filter', async () => {
      const mockMeters: Meter[] = [
        { id: '1', name: 'Main Meter', identifier: 'M-001', type: 'physical' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockMeters },
      } as any);

      const result = await meterService.getMeterElements({ searchQuery: 'Main' });

      expect(result).toEqual(mockMeters);
      expect(apiClient.get).toHaveBeenCalledWith('/meters/elements', {
        params: { searchQuery: 'Main' },
      });
    });

    it('should fetch meters with multiple filters', async () => {
      const mockMeters: Meter[] = [
        { id: '2', name: 'Meter 2', identifier: 'M-002', type: 'physical' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockMeters },
      } as any);

      const result = await meterService.getMeterElements({
        type: 'physical',
        excludeIds: '1',
        searchQuery: 'Meter',
      });

      expect(result).toEqual(mockMeters);
      expect(apiClient.get).toHaveBeenCalledWith('/meters/elements', {
        params: { type: 'physical', excludeIds: '1', searchQuery: 'Meter' },
      });
    });

    it('should filter out meters with missing required fields', async () => {
      const mockMeters: any[] = [
        { id: '1', name: 'Meter 1', identifier: 'M-001' },
        { id: '3', identifier: 'M-003' }, // Missing name
        { name: 'Meter 4', identifier: 'M-004' }, // Missing id
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockMeters },
      } as any);

      const result = await meterService.getMeterElements();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: '1', name: 'Meter 1', identifier: 'M-001' });
    });

    it('should throw error on API failure', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(meterService.getMeterElements()).rejects.toThrow('Failed to load available meters');
    });

    it('should throw error on invalid response format', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true }, // Missing data field
      } as any);

      await expect(meterService.getMeterElements()).rejects.toThrow('Failed to load available meters');
    });

    it('should retry on transient network errors', async () => {
      // First call fails with non-retryable error (client error)
      const error: any = { response: { status: 400 } };
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(meterService.getMeterElements()).rejects.toThrow();

      // Should only be called once (no retries for client errors)
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no meters available', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: [] },
      } as any);

      const result = await meterService.getMeterElements();

      expect(result).toEqual([]);
    });
  });

  describe('getVirtualMeterConfig', () => {
    it('should fetch virtual meter configuration and return SelectedItem[]', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          selectedItems: [
            { selectionType: 'meter', meter_id: 2, meter_name: 'Meter B', identifier: 'SN002' },
            { selectionType: 'element', meter_id: 3, meter_name: 'Meter C', identifier: 'SN003', meter_element_id: 10, element_name: 'Energy', element: 'kWh' },
          ],
        },
      } as any);

      const result = await meterService.getVirtualMeterConfig('1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ selectionType: 'meter', id: 'meter-2', meter_id: 2 }));
      expect(result[1]).toEqual(expect.objectContaining({ selectionType: 'element', id: 'element-10', meter_element_id: 10 }));
      expect(apiClient.get).toHaveBeenCalledWith('/meters/1/virtual-config');
    });

    it('should handle numeric meter ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          selectedItems: [
            { selectionType: 'meter', meter_id: 2, meter_name: 'Meter B', identifier: 'SN002' },
          ],
        },
      } as any);

      const result = await meterService.getVirtualMeterConfig(1);

      expect(result).toHaveLength(1);
      expect(result[0].meter_id).toBe(2);
      expect(apiClient.get).toHaveBeenCalledWith('/meters/1/virtual-config');
    });

    it('should return empty array when selectedItems is absent', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true },
      } as any);

      const result = await meterService.getVirtualMeterConfig('1');

      expect(result).toEqual([]);
    });

    it('should throw error when meter ID is missing', async () => {
      await expect(meterService.getVirtualMeterConfig('')).rejects.toThrow('Meter ID is required');
    });

    it('should throw error on API failure', async () => {
      const error = new Error('Server error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(meterService.getVirtualMeterConfig('1')).rejects.toThrow(
        'Failed to load virtual meter configuration'
      );
    });

    it('should throw error on invalid response format', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: false, message: 'Invalid response' },
      } as any);

      await expect(meterService.getVirtualMeterConfig('1')).rejects.toThrow(
        'Failed to load virtual meter configuration'
      );
    });

    it('should retry on transient errors', async () => {
      // First call fails with non-retryable error (client error)
      const error: any = { response: { status: 400 } };
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(meterService.getVirtualMeterConfig('1')).rejects.toThrow();

      // Should only be called once (no retries for client errors)
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveVirtualMeterConfig', () => {
    const METER_ITEMS: import('./meterService').SelectedItem[] = [
      { selectionType: 'meter', id: 'meter-2', meter_id: 2, meter_name: 'Meter B', identifier: 'SN002' },
      { selectionType: 'element', id: 'element-10', meter_id: 3, meter_name: 'Meter C', identifier: 'SN003', meter_element_id: 10, element_name: 'Energy', element: 'kWh' },
    ];

    it('should save virtual meter configuration', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { success: true },
      } as any);

      await meterService.saveVirtualMeterConfig('1', METER_ITEMS);

      expect(apiClient.post).toHaveBeenCalledWith('/meters/1/virtual-config', {
        selectedMeterIds: [2, 3],
        selectedMeterElementIds: [2, 10], // meter → meter_id, element → meter_element_id
        operations: ['+', '+'],
      });
    });

    it('should handle numeric meter ID', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { success: true },
      } as any);

      await meterService.saveVirtualMeterConfig(1, METER_ITEMS);

      expect(apiClient.post).toHaveBeenCalledWith('/meters/1/virtual-config', expect.any(Object));
    });

    it('should save empty selections', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { success: true },
      } as any);

      await meterService.saveVirtualMeterConfig('1', []);

      expect(apiClient.post).toHaveBeenCalledWith('/meters/1/virtual-config', {
        selectedMeterIds: [],
        selectedMeterElementIds: [],
        operations: [],
      });
    });

    it('should throw error when meter ID is missing', async () => {
      await expect(meterService.saveVirtualMeterConfig('', METER_ITEMS)).rejects.toThrow('Meter ID is required');
    });

    it('should throw error on API failure', async () => {
      const error = new Error('Server error');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(meterService.saveVirtualMeterConfig('1', METER_ITEMS)).rejects.toThrow(
        'Failed to save virtual meter configuration'
      );
    });

    it('should retry on transient errors', async () => {
      // First call fails with non-retryable error (client error)
      const error: any = { response: { status: 400 } };
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(meterService.saveVirtualMeterConfig('1', METER_ITEMS)).rejects.toThrow();

      // Should only be called once (no retries for client errors)
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });

    it('should not retry on client errors (4xx)', async () => {
      const error: any = {
        response: { status: 400, data: { message: 'Bad request' } },
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(meterService.saveVirtualMeterConfig('1', METER_ITEMS)).rejects.toThrow(
        'Failed to save virtual meter configuration'
      );

      // Should only be called once (no retries)
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should provide descriptive error messages for network failures', async () => {
      const error: any = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };

      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      try {
        await meterService.getMeterElements();
        expect.fail('Should have thrown an error');
      } catch (err: any) {
        expect(err.message).toContain('Failed to load available meters');
      }
    });

    it('should extract error message from API response', async () => {
      const error: any = {
        response: {
          status: 500,
          data: { message: 'Database connection failed' },
        },
      };

      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      try {
        await meterService.getMeterElements();
        expect.fail('Should have thrown an error');
      } catch (err: any) {
        expect(err.message).toContain('Database connection failed');
      }
    });
  });

  describe('Retry logic', () => {
    it('should not retry on client errors (4xx)', async () => {
      const error: any = { response: { status: 400, data: { message: 'Bad request' } } };

      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(meterService.getMeterElements()).rejects.toThrow(
        'Failed to load available meters'
      );

      // Should only be called once (no retries)
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle retryable errors (5xx)', async () => {
      const error: any = { response: { status: 500, data: { message: 'Server error' } } };

      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(meterService.getMeterElements()).rejects.toThrow(
        'Failed to load available meters'
      );

      // Should be called multiple times (retries for 5xx)
      expect(apiClient.get).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const error: any = { code: 'ECONNREFUSED', message: 'Connection refused' };

      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(meterService.getMeterElements()).rejects.toThrow(
        'Failed to load available meters'
      );

      // Should be called (retries for network errors)
      expect(apiClient.get).toHaveBeenCalled();
    });
  });
});
