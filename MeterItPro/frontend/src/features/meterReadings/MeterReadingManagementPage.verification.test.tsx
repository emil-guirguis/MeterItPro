/**
 * Verification Tests for MeterReadingManagementPage Parameter Passing
 *
 * Feature: fix-meter-readings-datagrid
 * Tests that MeterReadingManagementPage correctly extracts and passes
 * tenantId, meterId, and meterElementId to the store
 *
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MeterReadingManagementPage } from './MeterReadingManagementPage';
import { MeterSelectionProvider } from '../../contexts/MeterSelectionContext';
import { useMeterReadingsEnhanced } from './meterReadingsStore';

// Mock the MeterReadingList component
vi.mock('./MeterReadingList', () => ({
  MeterReadingList: () => <div data-testid="meter-reading-list">Meter Reading List</div>
}));

// Mock MeterReadingForm and DetailedMeterReadingView to avoid context dependencies
vi.mock('./MeterReadingForm', () => ({
  MeterReadingForm: () => null
}));
vi.mock('./DetailedMeterReadingView', () => ({
  DetailedMeterReadingView: () => null
}));

// Mock meterReadingService to avoid API calls
vi.mock('../../services/meterReadingService', () => ({
  meterReadingService: {
    getLastMeterReading: vi.fn().mockResolvedValue(null),
  }
}));

// Mock the store
vi.mock('./meterReadingsStore', () => ({
  useMeterReadingsEnhanced: vi.fn(),
  useMeterReadings: vi.fn()
}));

// Mock useAuth hook using vi.fn() so individual tests can override
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

describe('MeterReadingManagementPage - Parameter Passing Verification', () => {
  const mockFetchItems = vi.fn();
  const mockStore = {
    items: [],
    loading: false,
    error: null,
    fetchItems: mockFetchItems,
    totalReadings: 0,
    goodQualityReadings: [],
    estimatedReadings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMeterReadingsEnhanced as any).mockReturnValue(mockStore);
    mockUseAuth.mockReturnValue({ user: { id: 'user-123', client: 'tenant-123' } });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  /** Helper to render with a given URL */
  const renderWithUrl = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      </MemoryRouter>
    );

  describe('Task 2: Verify parameter passing to store.fetchItems()', () => {
    /**
     * Test: MeterReadingManagementPage passes tenantId from auth.user?.client
     * Validates: Requirement 1.1
     */
    it('should pass tenantId from auth.user?.client to store.fetchItems()', async () => {
      renderWithUrl('/?meterId=meter-123');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.tenantId).toBe('tenant-123');
    });

    /**
     * Test: MeterReadingManagementPage passes meterId from URL params
     * Validates: Requirement 1.2
     */
    it('should pass meterId from URL params to store.fetchItems()', async () => {
      renderWithUrl('/?meterId=meter-456&elementId=element-789');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.meterId).toBe('meter-456');
    });

    /**
     * Test: MeterReadingManagementPage passes meterElementId from URL params
     * Validates: Requirement 1.2
     */
    it('should pass meterElementId from URL params to store.fetchItems()', async () => {
      renderWithUrl('/?meterId=meter-456&elementId=element-789');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.meterElementId).toBe('element-789');
    });

    /**
     * Test: MeterReadingManagementPage passes all three parameters together
     * Validates: Requirements 1.1, 1.2
     */
    it('should pass all three parameters (tenantId, meterId, meterElementId) together', async () => {
      renderWithUrl('/?meterId=meter-456&elementId=element-789');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.tenantId).toBe('tenant-123');
      expect(callArgs.meterId).toBe('meter-456');
      expect(callArgs.meterElementId).toBe('element-789');
    });

    /**
     * Test: MeterReadingManagementPage handles missing elementId
     * Validates: Requirement 1.2
     */
    it('should handle missing elementId gracefully', async () => {
      renderWithUrl('/?meterId=meter-456');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.tenantId).toBe('tenant-123');
      expect(callArgs.meterId).toBe('meter-456');
      expect(callArgs.meterElementId).toBeUndefined();
    });

    /**
     * Test: MeterReadingManagementPage fetch parameters object structure
     * Validates: Requirement 1.2
     */
    it('should pass fetch parameters as an object with correct structure', async () => {
      renderWithUrl('/?meterId=meter-456&elementId=element-789');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(typeof callArgs).toBe('object');
      expect(callArgs).toHaveProperty('tenantId');
      expect(callArgs).toHaveProperty('meterId');
      expect(callArgs).toHaveProperty('meterElementId');
    });

    /**
     * Test: MeterReadingManagementPage does not fetch without meterId
     * Validates: Requirement 1.2
     */
    it('should not fetch if meterId is missing', async () => {
      renderWithUrl('/?elementId=element-789');

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetchItems).not.toHaveBeenCalled();
    });

    /**
     * Test: MeterReadingManagementPage does not fetch without tenantId
     * Validates: Requirement 1.2
     */
    it('should not fetch if tenantId is missing', async () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-123', client: null } });

      renderWithUrl('/?meterId=meter-456&elementId=element-789');

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetchItems).not.toHaveBeenCalled();
    });
  });

  describe('Fetch parameters validation', () => {
    /**
     * Test: Fetch parameters include all required fields
     * Validates: Requirement 1.2
     */
    it('should include all required fields in fetch parameters', async () => {
      renderWithUrl('/?meterId=meter-456&elementId=element-789');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(Object.keys(callArgs)).toContain('tenantId');
      expect(Object.keys(callArgs)).toContain('meterId');
      expect(Object.keys(callArgs)).toContain('meterElementId');
    });

    /**
     * Test: Fetch parameters have correct data types
     * Validates: Requirement 1.2
     */
    it('should have correct data types for fetch parameters', async () => {
      renderWithUrl('/?meterId=meter-456&elementId=element-789');

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });

      const callArgs = mockFetchItems.mock.calls[0][0];
      expect(typeof callArgs.tenantId).toBe('string');
      expect(typeof callArgs.meterId).toBe('string');
      expect(typeof callArgs.meterElementId).toBe('string');
    });
  });
});
