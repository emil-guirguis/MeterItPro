/**
 * Tests for MeterReadingExportButtons Component
 * 
 * Feature: meter-reading-export
 * Requirements: 6.1, 6.4, 6.5
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeterReadingExportButtons } from './MeterReadingExportButtons';
import { NotificationProvider } from './NotificationProvider';
import type { MeterReading } from '../utils/csvGenerator';

// Mock the export and email handlers
vi.mock('../utils/exportHandler', () => ({
  handleExport: vi.fn(),
}));

vi.mock('../utils/emailHandler', () => ({
  handleEmail: vi.fn(),
}));

vi.mock('../utils/filenameFormatter', () => ({
  formatExportFilename: vi.fn((name) => `${name}_export.csv`),
}));

import { handleExport } from '../utils/exportHandler';
import { handleEmail } from '../utils/emailHandler';

describe('MeterReadingExportButtons', () => {
  const mockMeterReadings: MeterReading[] = [
    {
      meter_id: 1,
      meter_element_id: 10,
      power: 100,
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      meter_id: 1,
      meter_element_id: 10,
      power: 110,
      created_at: '2024-01-15T11:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithNotification = (component: React.ReactElement) => {
    return render(
      <NotificationProvider>
        {component}
      </NotificationProvider>
    );
  };

  describe('Button Rendering', () => {
    it('should render both Export and Email buttons', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
      expect(screen.getByTestId('email-button')).toBeInTheDocument();
    });

    it('should render buttons with correct labels', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should render buttons with icons', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const emailButton = screen.getByTestId('email-button');

      // Check that buttons have SVG icons (MUI icons)
      expect(exportButton.querySelector('svg')).toBeInTheDocument();
      expect(emailButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Button Disabled State', () => {
    it('should disable buttons when loading is true', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
          loading={true}
        />
      );

      expect(screen.getByTestId('export-button')).toBeDisabled();
      expect(screen.getByTestId('email-button')).toBeDisabled();
    });

    it('should disable buttons when filteredData is empty', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={[]}
          selectedElementName="Main Pump"
        />
      );

      expect(screen.getByTestId('export-button')).toBeDisabled();
      expect(screen.getByTestId('email-button')).toBeDisabled();
    });

    it('should disable buttons when filteredData is null', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={null as any}
          selectedElementName="Main Pump"
        />
      );

      expect(screen.getByTestId('export-button')).toBeDisabled();
      expect(screen.getByTestId('email-button')).toBeDisabled();
    });

    it('should disable buttons when filteredData is undefined', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={undefined as any}
          selectedElementName="Main Pump"
        />
      );

      expect(screen.getByTestId('export-button')).toBeDisabled();
      expect(screen.getByTestId('email-button')).toBeDisabled();
    });

    it('should enable buttons when data is available and not loading', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
          loading={false}
        />
      );

      expect(screen.getByTestId('export-button')).not.toBeDisabled();
      expect(screen.getByTestId('email-button')).not.toBeDisabled();
    });
  });

  describe('Tooltip Display', () => {
    it('should display tooltip on export button hover', async () => {
      const user = userEvent.setup();
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      await user.hover(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Export.*meter readings as CSV file/)).toBeInTheDocument();
      });
    });

    it('should display tooltip on email button hover', async () => {
      const user = userEvent.setup();
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const emailButton = screen.getByTestId('email-button');
      await user.hover(emailButton);

      await waitFor(() => {
        expect(screen.getByText(/Email.*meter readings to colleagues/)).toBeInTheDocument();
      });
    });

    it('should have correct tooltip text when data is loading', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
          loading={true}
        />
      );

      const exportButton = screen.getByTestId('export-button');
      expect(exportButton).toBeDisabled();
    });

    it('should have correct tooltip text when no data available', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={[]}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Button Click Handlers', () => {
    it('should call handleExport when export button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(handleExport).mockResolvedValue(undefined);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      await waitFor(() => {
        expect(handleExport).toHaveBeenCalled();
      });
    });

    it('should call handleEmail when email button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(handleEmail).mockResolvedValue(undefined);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const emailButton = screen.getByTestId('email-button');
      await user.click(emailButton);

      await waitFor(() => {
        expect(handleEmail).toHaveBeenCalled();
      });
    });

    it('should pass correct options to handleExport', async () => {
      const user = userEvent.setup();
      vi.mocked(handleExport).mockResolvedValue(undefined);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
          selectedMeterName="Meter 1"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      await waitFor(() => {
        expect(handleExport).toHaveBeenCalledWith(
          expect.objectContaining({
            data: mockMeterReadings,
            filename: expect.stringContaining('Main Pump'),
          })
        );
      });
    });

    it('should pass correct options to handleEmail', async () => {
      const user = userEvent.setup();
      vi.mocked(handleEmail).mockResolvedValue(undefined);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
          selectedMeterName="Meter 1"
        />
      );

      const emailButton = screen.getByTestId('email-button');
      await user.click(emailButton);

      await waitFor(() => {
        expect(handleEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            data: mockMeterReadings,
            filename: expect.stringContaining('Main Pump'),
            meterInfo: expect.stringContaining('Meter 1'),
          })
        );
      });
    });
  });

  describe('Loading Indicator Display', () => {
    it('should show loading indicator on export button during export', async () => {
      const user = userEvent.setup();
      let resolveExport: (() => void) | null = null;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });

      vi.mocked(handleExport).mockImplementation(async (options) => {
        options.onLoading?.(true);
        await exportPromise;
        options.onLoading?.(false);
      });

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      // Wait for loading state to be set
      await waitFor(() => {
        expect(screen.queryByText('Exporting...')).toBeInTheDocument();
      });

      // Resolve the export
      resolveExport?.();

      // Wait for loading state to be cleared
      await waitFor(() => {
        expect(screen.queryByText('Export')).toBeInTheDocument();
      });
    });

    it('should show loading indicator on email button during email', async () => {
      const user = userEvent.setup();
      let resolveEmail: (() => void) | null = null;
      const emailPromise = new Promise<void>((resolve) => {
        resolveEmail = resolve;
      });

      vi.mocked(handleEmail).mockImplementation(async (options) => {
        options.onLoading?.(true);
        await emailPromise;
        options.onLoading?.(false);
      });

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const emailButton = screen.getByTestId('email-button');
      await user.click(emailButton);

      // Wait for loading state to be set
      await waitFor(() => {
        expect(screen.queryByText('Sending...')).toBeInTheDocument();
      });

      // Resolve the email
      resolveEmail?.();

      // Wait for loading state to be cleared
      await waitFor(() => {
        expect(screen.queryByText('Email')).toBeInTheDocument();
      });
    });

    it('should disable both buttons during export', async () => {
      const user = userEvent.setup();
      let resolveExport: (() => void) | null = null;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });

      vi.mocked(handleExport).mockImplementation(async (options) => {
        options.onLoading?.(true);
        await exportPromise;
        options.onLoading?.(false);
      });

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const emailButton = screen.getByTestId('email-button');

      await user.click(exportButton);

      // Wait for both buttons to be disabled
      await waitFor(() => {
        expect(exportButton).toBeDisabled();
        expect(emailButton).toBeDisabled();
      });

      // Resolve the export
      resolveExport?.();

      // Wait for buttons to be enabled again
      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
        expect(emailButton).not.toBeDisabled();
      });
    });

    it('should disable both buttons during email', async () => {
      const user = userEvent.setup();
      let resolveEmail: (() => void) | null = null;
      const emailPromise = new Promise<void>((resolve) => {
        resolveEmail = resolve;
      });

      vi.mocked(handleEmail).mockImplementation(async (options) => {
        options.onLoading?.(true);
        await emailPromise;
        options.onLoading?.(false);
      });

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const emailButton = screen.getByTestId('email-button');

      await user.click(emailButton);

      // Wait for both buttons to be disabled
      await waitFor(() => {
        expect(exportButton).toBeDisabled();
        expect(emailButton).toBeDisabled();
      });

      // Resolve the email
      resolveEmail?.();

      // Wait for buttons to be enabled again
      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
        expect(emailButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should call onNotifyError when export fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Export failed');
      vi.mocked(handleExport).mockRejectedValue(error);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      await waitFor(() => {
        // The error notification should be displayed
        expect(screen.getByText('Export failed')).toBeInTheDocument();
      });
    });

    it('should call onNotifyError when email fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Email failed');
      vi.mocked(handleEmail).mockRejectedValue(error);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const emailButton = screen.getByTestId('email-button');
      await user.click(emailButton);

      await waitFor(() => {
        // The error notification should be displayed
        expect(screen.getByText('Email failed')).toBeInTheDocument();
      });
    });

    it('should handle non-Error exceptions', async () => {
      const user = userEvent.setup();
      vi.mocked(handleExport).mockRejectedValue('Unknown error');

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      await waitFor(() => {
        // The error notification should be displayed
        expect(screen.getByText('Failed to export meter readings')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const emailButton = screen.getByTestId('email-button');

      expect(exportButton).toHaveAttribute('aria-label', expect.stringContaining('Export'));
      expect(emailButton).toHaveAttribute('aria-label', expect.stringContaining('Email'));
    });

    it('should have aria-busy attribute during loading', async () => {
      const user = userEvent.setup();
      let resolveExport: (() => void) | null = null;
      const exportPromise = new Promise<void>((resolve) => {
        resolveExport = resolve;
      });

      vi.mocked(handleExport).mockImplementation(async (options) => {
        options.onLoading?.(true);
        await exportPromise;
        options.onLoading?.(false);
      });

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      await waitFor(() => {
        expect(exportButton).toHaveAttribute('aria-busy', 'true');
      });

      resolveExport?.();

      await waitFor(() => {
        expect(exportButton).toHaveAttribute('aria-busy', 'false');
      });
    });

    it('should have aria-describedby for tooltip support', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const emailButton = screen.getByTestId('email-button');

      expect(exportButton).toHaveAttribute('aria-describedby');
      expect(emailButton).toHaveAttribute('aria-describedby');
    });

    it('should have title attribute for tooltip fallback', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const emailButton = screen.getByTestId('email-button');

      expect(exportButton).toHaveAttribute('title');
      expect(emailButton).toHaveAttribute('title');
    });

    it('should have role="group" on container', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const container = screen.getByRole('group', { name: 'Meter reading export options' });
      expect(container).toBeInTheDocument();
    });

    it('should be keyboard accessible with Enter key', async () => {
      const user = userEvent.setup();
      vi.mocked(handleExport).mockResolvedValue(undefined);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      
      // Tab to button and press Enter
      exportButton.focus();
      expect(exportButton).toHaveFocus();
      
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(handleExport).toHaveBeenCalled();
      });
    });

    it('should be keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      vi.mocked(handleExport).mockResolvedValue(undefined);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      
      // Tab to button and press Space
      exportButton.focus();
      expect(exportButton).toHaveFocus();
      
      await user.keyboard(' ');

      await waitFor(() => {
        expect(handleExport).toHaveBeenCalled();
      });
    });

    it('should have descriptive aria-labels with data count', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const ariaLabel = exportButton.getAttribute('aria-label');

      expect(ariaLabel).toContain('2');
      expect(ariaLabel).toContain('CSV');
    });

    it('should have descriptive aria-labels when disabled', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={[]}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const ariaLabel = exportButton.getAttribute('aria-label');

      expect(ariaLabel).toContain('disabled');
      expect(ariaLabel).toContain('no meter readings available');
    });

    it('should support custom aria-label prefix', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
          ariaLabelPrefix="Dashboard"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      const ariaLabel = exportButton.getAttribute('aria-label');

      expect(ariaLabel).toContain('Dashboard');
    });

    it('should have focus-visible styles for keyboard navigation', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const exportButton = screen.getByTestId('export-button');
      exportButton.focus();

      // Check that the button has focus
      expect(exportButton).toHaveFocus();
    });
  });

  describe('Default Props', () => {
    it('should use default values when props are not provided', () => {
      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
        />
      );

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
      expect(screen.getByTestId('email-button')).toBeInTheDocument();
    });

    it('should handle missing selectedMeterName gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(handleEmail).mockResolvedValue(undefined);

      renderWithNotification(
        <MeterReadingExportButtons
          filteredData={mockMeterReadings}
          selectedElementName="Main Pump"
        />
      );

      const emailButton = screen.getByTestId('email-button');
      await user.click(emailButton);

      await waitFor(() => {
        expect(handleEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            meterInfo: expect.stringContaining('Main Pump'),
          })
        );
      });
    });
  });
});
