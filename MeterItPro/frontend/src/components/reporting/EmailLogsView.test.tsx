
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EmailLogsView from './EmailLogsView';
import * as reportingService from '../../services/reportingService';

vi.mock('../../services/reportingService');

describe('EmailLogsView', () => {
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
    },
    {
      report_email_logs_id: 3,
      report_id: 1,
      report_history_id: 1,
      recipient: 'user3@example.com',
      sent_at: new Date('2024-01-15T09:00:02Z').toISOString(),
      status: 'sent' as const,
      error_details: null,
      created_at: new Date('2024-01-15T09:00:02Z').toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email logs table', () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    expect(screen.getByText('Recipient')).toBeInTheDocument();
    expect(screen.getByText('Sent At')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should display all email logs', () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('user3@example.com')).toBeInTheDocument();
  });

  it('should display status chips with correct colors', () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('should display error details for failed emails', () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('should search email logs by recipient', async () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const searchInput = screen.getByLabelText('Search by Recipient');
    await userEvent.type(searchInput, 'user1');

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.queryByText('user2@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('user3@example.com')).not.toBeInTheDocument();
  });

  it('should perform case-insensitive search', async () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const searchInput = screen.getByLabelText('Search by Recipient');
    await userEvent.type(searchInput, 'USER1');

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
  });

  it('should export as CSV', async () => {
    const mockCSVData = 'ID,Report ID,History ID,Recipient,Sent At,Status,Error Details,Created At\nemail-1,report-1,history-1,user1@example.com,...';
    (reportingService.exportEmailLogs as any).mockResolvedValue(mockCSVData);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const csvButton = screen.getByRole('button', { name: /csv/i });
    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(reportingService.exportEmailLogs).toHaveBeenCalledWith('csv', 1);
    });
  });

  it('should export as JSON', async () => {
    const mockJSONData = {
      success: true,
      data: {
        emails: mockEmailLogs,
        exportedAt: new Date().toISOString(),
        count: 3
      }
    };
    (reportingService.exportEmailLogs as any).mockResolvedValue(mockJSONData);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const jsonButton = screen.getByRole('button', { name: /json/i });
    fireEvent.click(jsonButton);

    await waitFor(() => {
      expect(reportingService.exportEmailLogs).toHaveBeenCalledWith('json', 1);
    });
  });

  it('should handle export error', async () => {
    (reportingService.exportEmailLogs as any).mockRejectedValue(
      new Error('Export failed')
    );

    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const csvButton = screen.getByRole('button', { name: /csv/i });
    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  it('should disable export buttons when no logs', () => {
    render(
      <EmailLogsView
        emailLogs={[]}
        reportId={1}
      />
    );

    const csvButton = screen.getByRole('button', { name: /csv/i });
    const jsonButton = screen.getByRole('button', { name: /json/i });

    expect(csvButton).toHaveAttribute('disabled');
    expect(jsonButton).toHaveAttribute('disabled');
  });

  it('should display empty state', () => {
    render(
      <EmailLogsView
        emailLogs={[]}
        reportId={1}
      />
    );

    expect(screen.getByText('No email logs found.')).toBeInTheDocument();
  });

  it('should display no matching recipients message', async () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const searchInput = screen.getByLabelText('Search by Recipient');
    await userEvent.type(searchInput, 'nonexistent@example.com');

    expect(screen.getByText('No matching recipients found.')).toBeInTheDocument();
  });

  it('should display log count summary', () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    expect(screen.getByText('Showing 3 of 3 email logs')).toBeInTheDocument();
  });

  it('should update log count when filtering', async () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const searchInput = screen.getByLabelText('Search by Recipient');
    await userEvent.type(searchInput, 'user1');

    expect(screen.getByText('Showing 1 of 3 email logs')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    // Check that dates are formatted (not just raw ISO strings)
    const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should disable export buttons during export', async () => {
    (reportingService.exportEmailLogs as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
    );

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    render(
      <EmailLogsView
        emailLogs={mockEmailLogs}
        reportId={1}
      />
    );

    const csvButton = screen.getByRole('button', { name: /csv/i });
    fireEvent.click(csvButton);

    expect(csvButton).toHaveAttribute('disabled');
  });
});
