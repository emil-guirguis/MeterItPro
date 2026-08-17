/**
 * Meter Reading Export Buttons Component
 * 
 * Renders two action buttons for exporting meter readings:
 * - Export Excel button: Downloads meter readings as CSV file
 * - Email button: Opens email client with CSV file attached
 * 
 * Features:
 * - Displays loading state during export/email operations
 * - Disables buttons when data is loading or empty
 * - Shows tooltips on hover explaining button functions
 * - Handles click events and calls export/email handlers
 * - Displays loading indicator during operations
 * - Full keyboard navigation support (Tab, Enter, Space)
 * - ARIA labels for screen readers
 * - Screen reader support for tooltips
 * - Accessible focus management
 * 
 * Accessibility Features:
 * - ARIA labels describe button purpose for screen readers
 * - Keyboard accessible: Tab to focus, Enter/Space to activate
 * - Tooltips are announced to screen readers via aria-describedby
 * - Focus indicators visible for keyboard navigation
 * - Disabled state properly communicated to assistive technologies
 * - Loading state announced via aria-busy
 * 
 * Feature: meter-reading-export
 * Requirements: 6.1, 6.4, 6.5
 */

import React, { useState, useRef } from 'react';
import {
  Button,
  Tooltip,
  CircularProgress,
  Box,
  Stack,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EmailIcon from '@mui/icons-material/Email';
import { handleExport, type ExportOptions } from '../utils/exportHandler';
import { handleEmail, type EmailOptions } from '../utils/emailHandler';
import { formatExportFilename } from '../utils/filenameFormatter';
import { useNotificationContext } from './NotificationProvider';
import type { MeterReading } from '../utils/csvGenerator';
import './MeterReadingExportButtons.css';

/**
 * Props for the MeterReadingExportButtons component
 */
export interface MeterReadingExportButtonsProps {
  /** Array of meter readings to export */
  filteredData: MeterReading[];
  /** Name of the selected meter for display */
  selectedMeterName?: string;
  /** Name of the selected element for filename generation */
  selectedElementName?: string;
  /** Boolean indicating if data is loading */
  loading?: boolean;
  /** Optional aria-label prefix for custom accessibility labels */
  ariaLabelPrefix?: string;
}

/**
 * MeterReadingExportButtons Component
 * 
 * Renders Export Excel and Email buttons with loading states and tooltips.
 * Buttons are disabled when data is loading or empty.
 * 
 * Accessibility:
 * - ARIA labels describe button purpose for screen readers
 * - Keyboard accessible: Tab to focus, Enter/Space to activate
 * - Tooltips are announced to screen readers
 * - Focus indicators visible for keyboard navigation
 * - Disabled state properly communicated to assistive technologies
 * - Loading state announced via aria-busy
 * 
 * Validates: Requirements 6.1, 6.4, 6.5
 */
export const MeterReadingExportButtons: React.FC<MeterReadingExportButtonsProps> = ({
  filteredData,
  selectedMeterName = 'Meter',
  selectedElementName = 'Readings',
  loading = false,
  ariaLabelPrefix = '',
}) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const { showSuccess, showError } = useNotificationContext();
  
  // Refs for tooltip descriptions (for screen readers)
  const exportTooltipIdRef = useRef<string>('export-tooltip-' + Math.random().toString(36).substring(2, 11));
  const emailTooltipIdRef = useRef<string>('email-tooltip-' + Math.random().toString(36).substring(2, 11));

  /**
   * Determine if buttons should be disabled
   * Buttons are disabled when:
   * - Data is loading
   * - No data is available to export
   * - Export or email operation is in progress
   */
  const isDisabled = loading || !filteredData || filteredData.length === 0 || exportLoading || emailLoading;

  /**
   * Generate comprehensive ARIA label for export button
   * Includes context about what will be exported
   */
  const getExportAriaLabel = (): string => {
    const prefix = ariaLabelPrefix ? `${ariaLabelPrefix}: ` : '';
    if (loading) {
      return `${prefix}Loading meter readings for export`;
    }
    if (!filteredData || filteredData.length === 0) {
      return `${prefix}Export button disabled - no meter readings available`;
    }
    if (exportLoading) {
      return `${prefix}Exporting ${filteredData.length} meter readings as CSV file`;
    }
    return `${prefix}Export ${filteredData.length} meter readings as CSV file`;
  };

  /**
   * Generate comprehensive ARIA label for email button
   * Includes context about what will be emailed
   */
  const getEmailAriaLabel = (): string => {
    const prefix = ariaLabelPrefix ? `${ariaLabelPrefix}: ` : '';
    if (loading) {
      return `${prefix}Loading meter readings for email`;
    }
    if (!filteredData || filteredData.length === 0) {
      return `${prefix}Email button disabled - no meter readings available`;
    }
    if (emailLoading) {
      return `${prefix}Sending ${filteredData.length} meter readings via email`;
    }
    return `${prefix}Email ${filteredData.length} meter readings to colleagues`;
  };

  /**
   * Handle export button click
   * Generates CSV file and triggers browser download dialog
   */
  const handleExportClick = async () => {
    try {
      const filename = formatExportFilename(selectedElementName);
      
      const options: ExportOptions = {
        data: filteredData,
        filename,
        onLoading: setExportLoading,
        onNotifySuccess: showSuccess,
        onNotifyError: showError,
      };

      await handleExport(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export meter readings';
      showError(errorMessage);
    }
  };

  /**
   * Handle email button click
   * Generates CSV file and opens default email client
   */
  const handleEmailClick = async () => {
    try {
      const filename = formatExportFilename(selectedElementName);
      const meterInfo = selectedMeterName && selectedElementName 
        ? `${selectedMeterName} - ${selectedElementName}`
        : selectedElementName;
      
      const options: EmailOptions = {
        data: filteredData,
        filename,
        meterInfo,
        onLoading: setEmailLoading,
        onNotifySuccess: showSuccess,
        onNotifyError: showError,
      };

      await handleEmail(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send meter readings via email';
      showError(errorMessage);
    }
  };

  /**
   * Determine tooltip text based on button state
   * Tooltips provide additional context for both sighted and screen reader users
   */
  const getExportTooltip = (): string => {
    if (loading) {
      return 'Loading meter readings...';
    }
    if (!filteredData || filteredData.length === 0) {
      return 'No meter readings available to export';
    }
    return `Export ${filteredData.length} meter readings as CSV file`;
  };

  const getEmailTooltip = (): string => {
    if (loading) {
      return 'Loading meter readings...';
    }
    if (!filteredData || filteredData.length === 0) {
      return 'No meter readings available to email';
    }
    return `Email ${filteredData.length} meter readings to colleagues`;
  };

  /**
   * Handle keyboard events for accessibility
   * Ensures buttons respond to Enter and Space keys
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    callback: () => Promise<void>
  ) => {
    // Enter and Space keys should trigger the button action
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isDisabled) {
        callback();
      }
    }
  };

  return (
    <Box 
      className="meter-reading-export-buttons"
      role="group"
      aria-label="Meter reading export options"
    >
      <Stack direction="row" spacing={1}>
        {/* Export Excel Button */}
        <Tooltip 
          title={getExportTooltip()} 
          arrow
          enterDelay={200}
          leaveDelay={200}
        >
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                exportLoading ? (
                  <CircularProgress 
                    size={20}
                    aria-label="Exporting"
                  />
                ) : (
                  <FileDownloadIcon />
                )
              }
              onClick={handleExportClick}
              onKeyDown={(e) => handleKeyDown(e, handleExportClick)}
              disabled={isDisabled}
              aria-label={getExportAriaLabel()}
              aria-busy={exportLoading}
              aria-describedby={exportTooltipIdRef.current}
              data-testid="export-button"
              className="export-button"
              title={getExportTooltip()}
            >
              {exportLoading ? 'Exporting...' : 'Export'}
            </Button>
          </span>
        </Tooltip>

        {/* Email Button */}
        <Tooltip 
          title={getEmailTooltip()} 
          arrow
          enterDelay={200}
          leaveDelay={200}
        >
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                emailLoading ? (
                  <CircularProgress 
                    size={20}
                    aria-label="Sending"
                  />
                ) : (
                  <EmailIcon />
                )
              }
              onClick={handleEmailClick}
              onKeyDown={(e) => handleKeyDown(e, handleEmailClick)}
              disabled={isDisabled}
              aria-label={getEmailAriaLabel()}
              aria-busy={emailLoading}
              aria-describedby={emailTooltipIdRef.current}
              data-testid="email-button"
              className="email-button"
              title={getEmailTooltip()}
            >
              {emailLoading ? 'Sending...' : 'Email'}
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default MeterReadingExportButtons;
