/**
 * Export Handler Utility
 * 
 * Coordinates the export process by:
 * - Validating data exists before export
 * - Generating CSV using csvGenerator utility
 * - Generating filename using filenameFormatter utility
 * - Triggering browser file download dialog
 * - Handling user cancellation gracefully
 * - Displaying success/error notifications
 * - Managing loading state via callbacks
 * 
 * Feature: meter-reading-export
 * Requirements: 1.1, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4
 */

import { generateCSV, type MeterReading } from './csvGenerator';

/**
 * Options for the export handler
 */
export interface ExportOptions {
  /** Array of meter readings to export */
  data: MeterReading[];
  /** Filename for the exported CSV file */
  filename: string;
  /** Callback when export succeeds */
  onSuccess?: () => void;
  /** Callback when export fails */
  onError?: (error: Error) => void;
  /** Callback to manage loading state */
  onLoading?: (loading: boolean) => void;
  /** Callback to display success notification */
  onNotifySuccess?: (message: string) => void;
  /** Callback to display error notification */
  onNotifyError?: (message: string) => void;
}

/**
 * Triggers a browser file download by creating a blob and using a temporary link
 * 
 * @param csvContent - The CSV content as a string
 * @param filename - The filename for the downloaded file
 */
function triggerDownload(csvContent: string, filename: string): void {
  // Create a Blob from the CSV content with UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary URL for the blob
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Set the download attributes
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Handles the export process for meter readings
 * 
 * This function:
 * 1. Validates that data exists
 * 2. Generates CSV from the data
 * 3. Triggers the browser file download dialog
 * 4. Handles user cancellation gracefully
 * 5. Displays success/error notifications
 * 6. Manages loading state
 * 
 * @param options - Export options including data, filename, and callbacks
 * @returns Promise that resolves when export is complete
 * 
 * Validates: Requirements 1.1, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4
 */
export async function handleExport(options: ExportOptions): Promise<void> {
  const {
    data,
    filename,
    onSuccess,
    onError,
    onLoading,
    onNotifySuccess,
    onNotifyError,
  } = options;

  try {
    // Set loading state
    onLoading?.(true);

    // Validate data exists
    if (!data || data.length === 0) {
      const errorMessage = 'No meter readings available to export. Please adjust your filters.';
      onNotifyError?.(errorMessage);
      const error = new Error(errorMessage);
      onError?.(error);
      return;
    }

    // Generate CSV from the data
    const csvContent = generateCSV(data);

    // Validate CSV was generated
    if (!csvContent) {
      const errorMessage = 'Failed to generate export file. Please try again.';
      onNotifyError?.(errorMessage);
      const error = new Error(errorMessage);
      onError?.(error);
      return;
    }

    // Trigger the browser file download dialog
    triggerDownload(csvContent, filename);

    // Display success notification
    const successMessage = `Export successful: ${filename}`;
    onNotifySuccess?.(successMessage);

    // Call success callback
    onSuccess?.();
  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during export';
    onNotifyError?.(errorMessage);
    onError?.(error instanceof Error ? error : new Error(errorMessage));
  } finally {
    // Clear loading state
    onLoading?.(false);
  }
}
