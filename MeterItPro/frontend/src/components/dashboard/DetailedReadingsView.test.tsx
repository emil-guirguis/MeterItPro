import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DetailedReadingsView } from './DetailedReadingsView';
import * as dashboardService from '../../services/dashboardService';

// Mock the dashboard service
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getDetailedReadings: vi.fn(),
    exportReadingsToCSV: vi.fn(),
  },
}));

describe('DetailedReadingsView', () => {
  const mockCardId = 1;
  const mockCard = {
    dashboard_id: 1,
    tenant_id: 1,
    created_by_users_id: 1,
    meter_id: 1,
    meter_element_id: 1,
    card_name: 'Test Card',
    card_description: 'Test Description',
    selected_columns: ['active_energy', 'power'],
    time_frame_type: 'last_month' as const,
    visualization_type: 'line' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockReadingsResponse = {
    items: [
      {
        meter_reading_id: '1',
        created_at: '2024-01-31T23:59:00Z',
        active_energy: 1250.5,
        power: 45.25,
      },
      {
        meter_reading_id: '2',
        created_at: '2024-01-31T23:58:00Z',
        active_energy: 1249.8,
        power: 44.75,
      },
    ],
    pagination: {
      page: 1,
      pageSize: 50,
      total: 100,
      totalPages: 2,
      hasMore: true,
    },
    card_info: {
      card_name: 'Test Card',
      meter_element_name: 'Main Panel',
      time_frame: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    expect(screen.getByText('Loading detailed readings...')).toBeInTheDocument();
  });

  it('renders data grid with readings', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    // Check for data in grid
    expect(screen.getByText('1,250.50')).toBeInTheDocument();
    expect(screen.getByText('45.25')).toBeInTheDocument();
  });

  it('displays row count correctly', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      const rowCountDiv = screen.getByText(/Showing/);
      expect(rowCountDiv).toBeInTheDocument();
      expect(rowCountDiv.textContent).toContain('100');
    });
  });

  it('handles pagination', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next →');
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(vi.mocked(dashboardService.dashboardService.getDetailedReadings)).toHaveBeenCalledWith(
        mockCardId,
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('handles page size change', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    const pageSizeSelect = screen.getByDisplayValue('50') as HTMLSelectElement;
    fireEvent.change(pageSizeSelect, { target: { value: '100' } });

    await waitFor(() => {
      expect(vi.mocked(dashboardService.dashboardService.getDetailedReadings)).toHaveBeenCalledWith(
        mockCardId,
        expect.objectContaining({ pageSize: 100 })
      );
    });
  });

  it('handles sorting', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText(/CREATED AT/)).toBeInTheDocument();
    });

    const sortHeader = screen.getByText(/CREATED AT/);
    fireEvent.click(sortHeader);

    await waitFor(() => {
      expect(vi.mocked(dashboardService.dashboardService.getDetailedReadings)).toHaveBeenCalledWith(
        mockCardId,
        expect.objectContaining({ sortBy: 'created_at', sortOrder: 'asc' })
      );
    });
  });

  it('handles CSV export', async () => {
    const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );
    vi.mocked(dashboardService.dashboardService.exportReadingsToCSV).mockResolvedValue(mockBlob);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText('⬇️ Export CSV')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('⬇️ Export CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(vi.mocked(dashboardService.dashboardService.exportReadingsToCSV)).toHaveBeenCalledWith(
        mockCardId
      );
    });
  });

  it('handles back button click', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    const mockOnBack = vi.fn();
    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    });

    const backButton = screen.getByText('← Back to Dashboard');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('displays error message on fetch failure', async () => {
    const errorMessage = 'Failed to fetch readings';
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockRejectedValue(
      new Error(errorMessage)
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('displays empty state when no readings', async () => {
    const emptyResponse = {
      items: [],
      pagination: {
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
      card_info: mockReadingsResponse.card_info,
    };

    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      emptyResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText('No meter readings available for this card.')).toBeInTheDocument();
    });
  });

  it('formats numbers correctly', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      // Check that numbers are formatted with commas and decimals
      expect(screen.getByText('1,250.50')).toBeInTheDocument();
      expect(screen.getByText('45.25')).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    vi.mocked(dashboardService.dashboardService.getDetailedReadings).mockResolvedValue(
      mockReadingsResponse
    );

    render(<DetailedReadingsView cardId={mockCardId} card={mockCard} />);

    await waitFor(() => {
      // Check that timestamp is formatted
      const cells = screen.getAllByText(/\d+\/\d+\/\d+/);
      expect(cells.length).toBeGreaterThan(0);
    });
  });
});
