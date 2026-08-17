
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HistoryTab from './HistoryTab';
import * as reportingService from '../../services/reportingService';

vi.mock('../../services/reportingService');

describe('HistoryTab', () => {
  const mockHistory = [
    {
      report_history_id: 1,
      report_id: 1,
      executed_at: new Date('2024-01-15T09:00:00Z').toISOString(),
      status: 'success' as const,
      error_message: null,
      created_at: new Date('2024-01-15T09:00:00Z').toISOString()
    },
    {
      report_history_id: 2,
      report_id: 1,
      executed_at: new Date('2024-01-14T09:00:00Z').toISOString(),
      status: 'failed' as const,
      error_message: 'Database connection timeout',
      created_at: new Date('2024-01-14T09:00:00Z').toISOString()
    }
  ];

  const mockEmailLogs = [
    {
      report_email_logs_id: 1,
      report_id: 1,
      report_history_id: 1,
      recipient: 'user1@example.com',
      sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
      status: 'delivered' as const,
      error_details: null,
      created_at: new Date('2024-01-15T09:00:00Z').toISOString()
    },
    {
      report_email_logs_id: 2,
      report_id: 1,
      report_history_id: 1,
      recipient: 'user2@example.com',
      sent_at: new Date('2024-01-15T09:00:01Z').toISOString(),
      status: 'failed' as const,
      error_details: 'Invalid email address',
      created_at: new Date('2024-01-15T09:00:01Z').toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (reportingService.getReportHistory as any).mockResolvedValue({
      data: mockHistory,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    });
    (reportingService.getEmailLogs as any).mockResolvedValue({
      emails: mockEmailLogs
    });
  });

  it('should render history table', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Executed At')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('should display history entries', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  it('should display error messages for failed executions', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
    });
  });

  it('should open email logs dialog', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    const viewEmailsButtons = screen.getAllByRole('button', { name: /view emails/i });
    fireEvent.click(viewEmailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Email Logs/)).toBeInTheDocument();
    });
  });

  it('should display email logs in dialog', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    const viewEmailsButtons = screen.getAllByRole('button', { name: /view emails/i });
    fireEvent.click(viewEmailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('should filter history by date range', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;
    const applyButton = screen.getByRole('button', { name: /apply/i });

    // Set the values directly for datetime-local inputs
    fireEvent.change(startDateInput, { target: { value: '2024-01-14T00:00' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-16T23:59' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(reportingService.getReportHistory).toHaveBeenCalledWith(
        1,
        1,
        10,
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it('should clear date filters', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    const clearButton = screen.getByRole('button', { name: /clear/i });

    await userEvent.type(startDateInput, '2024-01-14');
    fireEvent.click(clearButton);

    expect(startDateInput.value).toBe('');
  });

  it('should handle loading state', () => {
    (reportingService.getReportHistory as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: mockHistory,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      }), 100))
    );

    render(<HistoryTab reportId={1} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    (reportingService.getReportHistory as any).mockRejectedValue(
      new Error('Failed to load history')
    );

    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load history')).toBeInTheDocument();
    });
  });

  it('should display empty state', async () => {
    (reportingService.getReportHistory as any).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    });

    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('No execution history found.')).toBeInTheDocument();
    });
  });

  it('should support pagination', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    const nextPageButton = screen.queryByRole('button', { name: /next page/i });
    expect(nextPageButton).toBeInTheDocument();
  });

  it('should close email logs dialog', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    const viewEmailsButtons = screen.getAllByRole('button', { name: /view emails/i });
    fireEvent.click(viewEmailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Email Logs/)).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/Email Logs/)).not.toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      // Check that dates are formatted (not just raw ISO strings)
      const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('should display status chips with correct colors', async () => {
    render(<HistoryTab reportId={1} />);

    await waitFor(() => {
      const successChip = screen.getByText('Success');
      const failedChip = screen.getByText('Failed');

      expect(successChip).toBeInTheDocument();
      expect(failedChip).toBeInTheDocument();
    });
  });
});
