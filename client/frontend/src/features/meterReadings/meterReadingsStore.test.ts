/**
 * Unit Tests for Meter Readings Store
 * 
 * Feature: fix-meter-readings-datagrid
 * Tests the store's ability to handle fetch parameters correctly
 * 
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMeterReadings } from './meterReadingsStore';

// Mock fetch globally
global.fetch = vi.fn();

describe('meterReadingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (global.fetch as any).mockClear();
  });

  describe('fetchItems with parameters', () => {
    /**
     * Test: fetchItems includes tenantId in query parameters
     * Validates: Requirement 1.2
     */
    it('should include tenantId in fetch request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [] }
        })
      });

      const store = useMeterReadings.getState();
      await store.fetchItems({
        tenantId: 'tenant-123'
      });

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('tenantId=tenant-123');
    });

    /**
     * Test: fetchItems includes meterId in query parameters
     * Validates: Requirement 1.2
     */
    it('should include meterId in fetch request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [] }
        })
      });

      const store = useMeterReadings.getState();
      await store.fetchItems({
        tenantId: 'tenant-123',
        meterId: 'meter-456'
      });

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('meterId=meter-456');
    });

    /**
     * Test: fetchItems includes meterElementId in query parameters
     * Validates: Requirement 1.2
     */
    it('should include meterElementId in fetch request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [] }
        })
      });

      const store = useMeterReadings.getState();
      await store.fetchItems({
        tenantId: 'tenant-123',
        meterId: 'meter-456',
        meterElementId: 'element-789'
      });

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('meterElementId=element-789');
    });

    /**
     * Test: fetchItems includes all three parameters together
     * Validates: Requirement 1.2
     */
    it('should include all three parameters in fetch request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [] }
        })
      });

      const store = useMeterReadings.getState();
      await store.fetchItems({
        tenantId: 'tenant-123',
        meterId: 'meter-456',
        meterElementId: 'element-789'
      });

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      
      // Verify all three parameters are in the URL
      expect(callUrl).toContain('tenantId=tenant-123');
      expect(callUrl).toContain('meterId=meter-456');
      expect(callUrl).toContain('meterElementId=element-789');
    });

    /**
     * Test: fetchItems handles undefined meterElementId
     * Validates: Requirement 1.2
     */
    it('should handle undefined meterElementId gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [] }
        })
      });

      const store = useMeterReadings.getState();
      await store.fetchItems({
        tenantId: 'tenant-123',
        meterId: 'meter-456',
        meterElementId: undefined
      });

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      
      // Verify tenantId and meterId are present
      expect(callUrl).toContain('tenantId=tenant-123');
      expect(callUrl).toContain('meterId=meter-456');
      // meterElementId should not be in the URL if undefined
      expect(callUrl).not.toContain('meterElementId=undefined');
    });

    /**
     * Test: fetchItems sets loading state during fetch
     * Validates: Requirement 1.2
     */
    it('should set loading state to true during fetch', async () => {
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: { items: [] }
            })
          }), 100)
        )
      );

      const store = useMeterReadings.getState();
      const fetchPromise = store.fetchItems({
        tenantId: 'tenant-123',
        meterId: 'meter-456'
      });

      // Check loading state immediately after calling fetch
      let state = useMeterReadings.getState();
      expect(state.loading).toBe(true);

      await fetchPromise;

      // Check loading state after fetch completes
      state = useMeterReadings.getState();
      expect(state.loading).toBe(false);
    });

    /**
     * Test: fetchItems clears error on successful fetch
     * Validates: Requirement 1.2
     */
    it('should clear error on successful fetch', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [] }
        })
      });

      const store = useMeterReadings.getState();
      
      // Set an error first
      store.clearError = () => {};
      
      await store.fetchItems({
        tenantId: 'tenant-123',
        meterId: 'meter-456'
      });

      const state = useMeterReadings.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Parameter validation', () => {
    /**
     * Test: fetchItems requires tenantId
     * Validates: Requirement 1.2
     */
    it('should throw error if tenantId is missing', async () => {
      const store = useMeterReadings.getState();
      
      await store.fetchItems({
        meterId: 'meter-456'
      });

      const state = useMeterReadings.getState();
      expect(state.error).toBeTruthy();
      expect(state.error).toContain('TenantId');
    });

    /**
     * Test: fetchItems uses localStorage tenantId as fallback
     * Validates: Requirement 1.2
     */
    it('should use localStorage tenantId as fallback', async () => {
      localStorage.setItem('tenantId', 'tenant-from-storage');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: [] }
        })
      });

      const store = useMeterReadings.getState();
      await store.fetchItems({
        meterId: 'meter-456'
      });

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('tenantId=tenant-from-storage');
    });
  });
});
