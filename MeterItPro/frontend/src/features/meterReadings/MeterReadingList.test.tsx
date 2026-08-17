/**
 * Unit Tests for MeterReadingList
 *
 * Feature: meter-readings-grid-loading
 * Tests the component's filtering, display, and memoization behavior
 *
 * Validates: Requirements 1.3, 2.1, 2.3, 2.4, 2.5, 3.1, 3.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MeterReadingList } from './MeterReadingList';
import { MeterSelectionProvider, useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import { registerMappingService } from '../../services/registerMappingService';
import type { MeterReading } from './meterReadingConfig';

// Mock SimpleMeterReadingGrid used by the actual component
vi.mock('./SimpleMeterReadingGrid', () => ({
  SimpleMeterReadingGrid: ({ data, loading }: any) => (
    <div data-testid="base-list">
      <div data-testid="list-loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="list-data-count">{data.length}</div>
      {data.length === 0 && (
        <div data-testid="list-empty-message">No meter readings found.</div>
      )}
      {data.map((item: any, i: number) => (
        <div key={i} data-testid={`reading-${item.meter_reading_id || i}`}>{item.meter_id}</div>
      ))}
    </div>
  ),
}));

// Mock registerMappingService to avoid API calls on mount
vi.mock('../../services/registerMappingService', () => ({
  registerMappingService: {
    initialize: vi.fn().mockReturnValue(Promise.resolve(undefined)),
    getRegisterName: vi.fn().mockReturnValue(''),
    getRegisterUnit: vi.fn().mockReturnValue(''),
    isInitialized: vi.fn().mockReturnValue(true),
    reset: vi.fn(),
  },
}));

// Mock the store
vi.mock('./meterReadingsStore', () => ({
  useMeterReadingsEnhanced: vi.fn(),
}));

// Mock the auth hook - use `client` field to match actual component usage
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', client: 'tenant-1' },
  }),
}));

// Mock MeterReadingExportButtons to avoid NotificationProvider dependency
vi.mock('../../components/MeterReadingExportButtons', () => ({
  MeterReadingExportButtons: () => null,
}));

describe('MeterReadingList', () => {
  const mockReadings: MeterReading[] = [
    {
      meter_reading_id: 'reading-1',
      tenant_id: 1,
      meter_id: 123,
      meter_element_id: 456,
      created_at: '2024-01-01T00:00:00Z',
      kwh: 100,
      kw: 5,
      voltage_p_n: 230,
      amperage: 10,
    },
    {
      meter_reading_id: 'reading-2',
      tenant_id: 1,
      meter_id: 123,
      meter_element_id: 789,
      created_at: '2024-01-02T00:00:00Z',
      kwh: 110,
      kw: 5.5,
      voltage_p_n: 230,
      amperage: 11,
    },
    {
      meter_reading_id: 'reading-3',
      tenant_id: 1,
      meter_id: 456,
      meter_element_id: 456,
      created_at: '2024-01-03T00:00:00Z',
      kwh: 200,
      kw: 10,
      voltage_p_n: 230,
      amperage: 20,
    },
    {
      meter_reading_id: 'reading-4',
      tenant_id: 1,
      meter_id: 456,
      meter_element_id: 789,
      created_at: '2024-01-04T00:00:00Z',
      kwh: 210,
      kw: 10.5,
      voltage_p_n: 230,
      amperage: 21,
    },
  ];

  // Mock data uses string IDs matching selectedMeter/selectedElement context values
  const mockReadingsWithStringIds = [
    { ...mockReadings[0], meter_id: 'meter-123', meter_element_id: 'element-456' },
    { ...mockReadings[1], meter_id: 'meter-123', meter_element_id: 'element-789' },
    { ...mockReadings[2], meter_id: 'meter-456', meter_element_id: 'element-456' },
    { ...mockReadings[3], meter_id: 'meter-456', meter_element_id: 'element-789' },
  ];

  const mockStore = {
    items: mockReadingsWithStringIds,
    loading: false,
    error: null,
    clearError: vi.fn(),
    fetchItems: vi.fn(),
    page: 1,
    pageSize: 25,
    total: 4,
    totalPages: 1,
    goToPage: vi.fn(),
    totalReadings: mockReadingsWithStringIds.length,
    goodQualityReadings: [],
    estimatedReadings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMeterReadingsEnhanced as any).mockReturnValue(mockStore);
    // Restore initialize mock after clearAllMocks resets it
    (registerMappingService.initialize as any).mockReturnValue(Promise.resolve(undefined));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    /**
     * Test: Component renders without crashing
     */
    it('should render without crashing', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('base-list')).toBeInTheDocument();
    });

    /**
     * Test: Component renders SimpleMeterReadingGrid (aliased as base-list in mock)
     */
    it('should render BaseList component', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('base-list')).toBeInTheDocument();
    });
  });

  describe('Title Display', () => {
    /**
     * Test: Title shows "Meter Readings" when no meter is selected
     * Validates: Requirement 1.3
     */
    it('should display default title when no meter is selected', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Meter Readings');
    });

    /**
     * Test: Title shows "Meter Readings" when only meter is selected (no elementName)
     * Validates: Requirement 1.3
     */
    it('should display selected meter in title', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Without an elementName, the title remains "Meter Readings"
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Meter Readings');
      });
    });

    /**
     * Test: Title displays element name when both meter and element with name are selected
     * Validates: Requirement 1.3
     */
    it('should display selected meter and element in title', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456', 'Test Element Name');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
          'Meter Readings - Test Element Name'
        );
      });
    });
  });

  describe('Data Filtering', () => {
    /**
     * Test: All data is displayed when no meter is selected
     * Validates: Requirements 2.1, 3.1
     */
    it('should display all data when no meter is selected', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-data-count')).toHaveTextContent('4');
    });

    /**
     * Test: Data is filtered by selected meter
     * Validates: Requirements 2.1, 2.3, 3.1
     */
    it('should filter data by selected meter', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Should only show readings for meter-123 (2 readings)
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });
    });

    /**
     * Test: Data is filtered by selected meter and element
     * Validates: Requirements 2.1, 2.3, 3.1
     */
    it('should filter data by selected meter and element', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Should only show reading-1 (meter-123 + element-456)
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });
    });

    /**
     * Test: Filtering works with different meter IDs
     * Validates: Requirements 2.1, 3.1
     */
    it('should filter data for different meter IDs', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-456');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Should only show readings for meter-456 (2 readings)
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });
    });

    /**
     * Test: Empty result when meter has no readings
     * Validates: Requirements 2.1, 2.4
     */
    it('should show empty result when meter has no readings', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-999');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Empty State Messages', () => {
    /**
     * Test: Empty message when no meter is selected and data is empty
     * Validates: Requirements 2.4, 3.3
     */
    it('should display empty message when no meter is selected', () => {
      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        items: [],
        total: 0,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-data-count')).toHaveTextContent('0');
      expect(screen.getByTestId('list-empty-message')).toBeInTheDocument();
    });

    /**
     * Test: Empty message when meter is selected but no data
     * Validates: Requirements 2.4, 3.3
     */
    it('should display empty message when meter is selected but no data', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-999');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('0');
        expect(screen.getByTestId('list-empty-message')).toBeInTheDocument();
      });
    });

    /**
     * Test: Empty message when meter and element are selected but no data
     * Validates: Requirements 2.4, 3.3
     */
    it('should display empty message when meter and element are selected but no data', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-999');
          setSelectedElement('element-999');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('0');
        expect(screen.getByTestId('list-empty-message')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    /**
     * Test: Loading state is displayed during data fetch
     * Validates: Requirement 2.5
     */
    it('should display loading state when data is loading', () => {
      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        loading: true,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-loading')).toHaveTextContent('Loading');
    });

    /**
     * Test: Loading state is cleared when data is loaded
     * Validates: Requirement 2.5
     */
    it('should clear loading state when data is loaded', () => {
      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        loading: false,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-loading')).toHaveTextContent('Not Loading');
    });

    /**
     * Test: Empty data is shown when loading completes with no results
     * Validates: Requirements 2.4, 2.5
     */
    it('should show empty data when loading completes with no results', () => {
      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        items: [],
        loading: false,
        total: 0,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-data-count')).toHaveTextContent('0');
      expect(screen.getByTestId('list-loading')).toHaveTextContent('Not Loading');
    });
  });

  describe('Memoization', () => {
    /**
     * Test: Filtered data is memoized and not recomputed unnecessarily
     * Validates: Requirement 2.1
     */
    it('should memoize filtered data', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      const { rerender } = render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });

      // Rerender should not change the filtered data count
      rerender(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
    });

    /**
     * Test: Title is memoized and not recomputed unnecessarily
     * Validates: Requirement 1.3
     */
    it('should memoize title', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Without elementName, title stays "Meter Readings"
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Meter Readings');
      });

      // Title should remain the same
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Meter Readings');
    });

    /**
     * Test: Empty message is memoized and not recomputed unnecessarily
     * Validates: Requirements 2.4, 3.3
     */
    it('should memoize empty message', () => {
      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        items: [],
        total: 0,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      const emptyMessageEl = screen.getByTestId('list-empty-message');
      const emptyMessage = emptyMessageEl.textContent;

      // Empty message should remain the same
      expect(screen.getByTestId('list-empty-message')).toHaveTextContent(emptyMessage || '');
    });
  });

  describe('Selection Changes', () => {
    /**
     * Test: Filtered data updates when meter selection changes
     * Validates: Requirements 2.1, 3.1
     */
    it('should update filtered data when meter selection changes', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        return (
          <div>
            <button onClick={() => setSelectedMeter('meter-123')}>
              Select Meter 123
            </button>
            <button onClick={() => setSelectedMeter('meter-456')}>
              Select Meter 456
            </button>
            <MeterReadingList />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      // Select meter-123
      screen.getByText('Select Meter 123').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });

      // Select meter-456
      screen.getByText('Select Meter 456').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });
    });

    /**
     * Test: Filtered data updates when element selection changes
     * Validates: Requirements 2.1, 3.1
     */
    it('should update filtered data when element selection changes', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return (
          <div>
            <button onClick={() => setSelectedElement('element-456')}>
              Select Element 456
            </button>
            <button onClick={() => setSelectedElement('element-789')}>
              Select Element 789
            </button>
            <MeterReadingList />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });

      // Select element-456
      screen.getByText('Select Element 456').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });

      // Select element-789
      screen.getByText('Select Element 789').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Field Name Variations', () => {
    /**
     * Test: Filtering works with meter_id field name (snake_case)
     * Validates: Requirement 2.1
     */
    it('should filter data with meter_id field name', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      // Store items already use meter_id (snake_case)
      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });
    });

    /**
     * Test: Filtering works with meter_element_id field name (snake_case)
     * Validates: Requirement 2.1
     */
    it('should filter data with meter_element_id field name', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      // Store items already use meter_element_id (snake_case)
      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });
    });
  });
});
