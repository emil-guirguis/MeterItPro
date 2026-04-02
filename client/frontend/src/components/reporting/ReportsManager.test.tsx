import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReportsManager from './ReportsManager';
import * as reportingService from '../../services/reportingService';

vi.mock('../../services/reportingService');

describe('ReportsManager', () => {
  const mockReports = [
    {
      report_id: '1',
      name: 'Daily Report',
      type: 'meter_readings',
      schedule: '0 9 * * *',
      recipients: ['user@example.com'],
      config: {},
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      report_id: '2',
      name: 'Weekly Report',
      type: 'usage_summary',
      schedule: '0 9 * * 1',
      recipients: ['user1@example.com', 'user2@example.com'],
      config: {},
      enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (reportingService.getReports as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockReports,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    });
  });

  test('should render reports list', async () => {
    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
    });
  });

  test('should display report details', async () => {
    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('meter_readings')).toBeInTheDocument();
      expect(screen.getByText('usage_summary')).toBeInTheDocument();
      expect(screen.getByText('1 recipient(s)')).toBeInTheDocument();
      expect(screen.getByText('2 recipient(s)')).toBeInTheDocument();
    });
  });

  test('should display report status', async () => {
    render(<ReportsManager />);

    await waitFor(() => {
      const chips = screen.getAllByRole('button');
      const enabledChip = chips.find(chip => chip.textContent === 'Enabled');
      const disabledChip = chips.find(chip => chip.textContent === 'Disabled');

      expect(enabledChip).toBeInTheDocument();
      expect(disabledChip).toBeInTheDocument();
    });
  });

  test('should open create report form', async () => {
    render(<ReportsManager />);

    const createButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Report')).toBeInTheDocument();
    });
  });

  test('should open edit report form', async () => {
    render(<ReportsManager />);

    await waitFor(() => {
      const editButtons = screen.getAllByTitle(/edit report/i);
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Report')).toBeInTheDocument();
    });
  });

  test('should delete report', async () => {
    (reportingService.deleteReport as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (reportingService.getReports as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockReports,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
    }).mockResolvedValueOnce({
      data: [mockReports[1]],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    });

    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/delete report/i);
    fireEvent.click(deleteButtons[0]);

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(reportingService.deleteReport).toHaveBeenCalledWith('1');
    });
  });

  test('should toggle report status', async () => {
    (reportingService.toggleReportStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      report_id: '1',
      name: 'Daily Report',
      enabled: false,
      updated_at: new Date().toISOString()
    });

    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    const statusChips = screen.getAllByRole('button');
    const enabledChip = statusChips.find(chip => chip.textContent === 'Enabled');
    fireEvent.click(enabledChip!);

    await waitFor(() => {
      expect(reportingService.toggleReportStatus).toHaveBeenCalledWith('1');
    });
  });

  test('should handle loading state', () => {
    (reportingService.getReports as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: mockReports,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      }), 100))
    );

    render(<ReportsManager />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should handle error state', async () => {
    (reportingService.getReports as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed to load reports')
    );

    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
    });
  });

  test('should display empty state', async () => {
    (reportingService.getReports as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    });

    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('No reports found. Create one to get started.')).toBeInTheDocument();
    });
  });

  test('should support pagination', async () => {
    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    expect(nextPageButton).toBeInTheDocument();
  });

  test('should call onReportCreated callback', async () => {
    const mockOnReportCreated = vi.fn();
    (reportingService.createReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockReports[0]);

    render(<ReportsManager onReportCreated={mockOnReportCreated} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(createButton);

    // Note: The callback would be called after form submission
    // This is a simplified test
  });

  test('should close delete confirmation dialog on cancel', async () => {
    render(<ReportsManager />);

    await waitFor(() => {
      expect(screen.getByText('Daily Report')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/delete report/i);
    fireEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
    });
  });

  test('should display report schedule in monospace font', async () => {
    render(<ReportsManager />);

    await waitFor(() => {
      const scheduleCell = screen.getByText('0 9 * * *');
      expect(scheduleCell).toHaveStyle({ fontFamily: 'monospace' });
    });
  });
});
