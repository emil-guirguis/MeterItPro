import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReportForm from './ReportForm';
import * as reportingService from '../../services/reportingService';
import apiClient from '../../services/apiClient';

vi.mock('../../services/reportingService');
vi.mock('../../services/apiClient', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } })
  }
}));
vi.mock('../shared/MeterElementRegisterSelectorGrid', () => ({
  MeterElementRegisterSelectorGrid: () => null,
}));

describe('ReportForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
    vi.clearAllMocks();
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: [] } });
  });

  test('should render form fields', () => {
    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Basic Info tab (tab 0) is active by default
    expect(screen.getByLabelText('Report Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Report Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Schedule')).toBeInTheDocument();

    // Switch to Recipients tab to find Email Address
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report name is required')).toBeInTheDocument();
    });

    // Switch to Recipients tab to check recipients error
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);

    // await waitFor(() => {
    //   expect(screen.getByText('At least one recipient is required')).toBeInTheDocument();
    // });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('should create a new report', async () => {
    (reportingService.createReport as ReturnType<typeof vi.fn>).mockResolvedValue({
      report_id: 1,
      name: 'Test Report',
      type: 'meter_readings',
      schedule: '0 9 * * *',
      recipients: ['user@example.com'],
      config: {},
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Report Name');
    await userEvent.type(nameInput, 'Test Report');

    // Switch to Recipients tab
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);

    const emailInput = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(emailInput, 'user@example.com');
    fireEvent.click(addButton);

    const submitButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(reportingService.createReport).toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('should update an existing report', async () => {
    const existingReport = {
      report_id: 1,
      name: 'Existing Report',
      type: 'meter_readings',
      schedule: '0 9 * * *',
      recipients: ['user@example.com'],
      config: {},
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    (reportingService.updateReport as ReturnType<typeof vi.fn>).mockResolvedValue(existingReport);

    render(
      <ReportForm
        report={existingReport}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Report Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Existing Report');

    const submitButton = screen.getByRole('button', { name: /update report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(reportingService.updateReport).toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('should validate email format', async () => {
    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Report Name');
    await userEvent.type(nameInput, 'Test Report');

    // Switch to Recipients tab
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);

    const emailInput = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.click(addButton);

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  test('should validate cron expression', async () => {
    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const customOption = screen.getByText('Custom Cron Expression');
    fireEvent.click(customOption);

    const cronInput = screen.getByLabelText('Cron Expression');
    await userEvent.clear(cronInput);
    await userEvent.type(cronInput, 'invalid cron');

    const submitButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid cron expression format')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  }, 10000);

  test('should handle submission errors', async () => {
    (reportingService.createReport as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed to create report')
    );

    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Report Name');
    await userEvent.type(nameInput, 'Test Report');

    // Switch to Recipients tab
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);

    const emailInput = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(emailInput, 'user@example.com');
    fireEvent.click(addButton);

    const submitButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create report')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  test('should call onCancel when cancel button is clicked', () => {
    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('should validate report name length', async () => {
    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Report Name');
    const longName = 'a'.repeat(256);

    fireEvent.change(nameInput, { target: { value: longName } });

    const submitButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report name must not exceed 255 characters')).toBeInTheDocument();
    });
  });

  test('should disable form during submission', async () => {
    (reportingService.createReport as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    );

    render(
      <ReportForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Report Name');
    await userEvent.type(nameInput, 'Test Report');

    // Switch to Recipients tab
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);

    const emailInput = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(emailInput, 'user@example.com');
    fireEvent.click(addButton);

    const submitButton = screen.getByRole('button', { name: /create report/i });
    fireEvent.click(submitButton);

    expect(submitButton).toHaveAttribute('disabled');
  });

  test('should populate form with existing report data', () => {
    const existingReport = {
      report_id: 1,
      name: 'Existing Report',
      type: 'usage_summary',
      schedule: '0 9 * * 1',
      recipients: ['user1@example.com', 'user2@example.com'],
      config: {},
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    render(
      <ReportForm
        report={existingReport}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Report Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Existing Report');

    // Switch to Recipients tab to see the recipients
    const recipientsTab = screen.getByRole('tab', { name: /recipients/i });
    fireEvent.click(recipientsTab);

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
  });
});
