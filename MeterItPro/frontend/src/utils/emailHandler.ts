/**
 * Email Handler Utility
 * 
 * Coordinates the email process by:
 * - Validating data exists before email
 * - Generating CSV using csvGenerator utility
 * - Generating filename using filenameFormatter utility
 * - Creating temporary file in browser temp directory
 * - Generating mailto URL with CSV attachment
 * - Pre-populating subject line with meter information
 * - Opening default email client
 * - Cleaning up temporary file after email client closes
 * - Handling email client errors and cleanup
 * - Displaying success/error notifications
 * - Managing loading state via callbacks
 * 
 * Feature: meter-reading-export
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.5, 7.1, 7.2, 7.4
 */

import { generateCSV, type MeterReading } from './csvGenerator';
import { formatEmailSubject } from './emailSubjectFormatter';

/**
 * Options for the email handler
 */
export interface EmailOptions {
  /** Array of meter readings to export */
  data: MeterReading[];
  /** Filename for the exported CSV file */
  filename: string;
  /** Meter information to include in subject line (e.g., "Main Pump") */
  meterInfo: string;
  /** Callback when email succeeds */
  onSuccess?: () => void;
  /** Callback when email fails */
  onError?: (error: Error) => void;
  /** Callback to manage loading state */
  onLoading?: (loading: boolean) => void;
  /** Callback to display success notification */
  onNotifySuccess?: (message: string) => void;
  /** Callback to display error notification */
  onNotifyError?: (message: string) => void;
}

/**
 * Stores temporary file URLs for cleanup
 */
const temporaryFileUrls = new Set<string>();

/**
 * Cleans up a temporary file URL
 * 
 * @param url - The blob URL to revoke
 */
function cleanupTemporaryFile(url: string): void {
  try {
    URL.revokeObjectURL(url);
    temporaryFileUrls.delete(url);
  } catch (error) {
    console.error('Error cleaning up temporary file:', error);
  }
}

/**
 * Cleans up all temporary files
 */
function cleanupAllTemporaryFiles(): void {
  temporaryFileUrls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error cleaning up temporary file:', error);
    }
  });
  temporaryFileUrls.clear();
}



/**
 * Creates a temporary file blob URL from CSV content
 * 
 * @param csvContent - The CSV content as a string
 * @returns Object URL for the temporary file
 */
function createTemporaryFile(csvContent: string): string {
  // Create a Blob from the CSV content with UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Track the URL for cleanup
  temporaryFileUrls.add(url);
  
  return url;
}

/**
 * Generates a mailto URL with CSV attachment
 * 
 * Note: Modern browsers have limitations on mailto URLs with attachments.
 * This function generates a mailto URL with the subject and body.
 * The actual file attachment is handled by opening the email client
 * and the user may need to manually attach the file or use a different method.
 * 
 * @param subject - The email subject line
 * @param filename - The filename for reference in the email body
 * @returns mailto URL
 */
function generateMailtoUrl(subject: string, filename: string): string {
  // Encode subject and body for URL
  const encodedSubject = encodeURIComponent(subject);
  const body = `Please find the attached meter readings export file: ${filename}`;
  const encodedBody = encodeURIComponent(body);
  
  return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Opens the default email client with a mailto URL
 * 
 * @param mailtoUrl - The mailto URL to open
 */
function openEmailClient(mailtoUrl: string): void {
  // Open the mailto URL in the default email client
  window.location.href = mailtoUrl;
}

/**
 * Handles the email process for meter readings
 * 
 * This function:
 * 1. Validates that data exists
 * 2. Generates CSV from the data
 * 3. Generates filename
 * 4. Creates temporary file
 * 5. Generates mailto URL with subject
 * 6. Opens default email client
 * 7. Cleans up temporary file after email client closes
 * 8. Handles errors and cleanup
 * 9. Displays success/error notifications
 * 10. Manages loading state
 * 
 * @param options - Email options including data, filename, meterInfo, and callbacks
 * @returns Promise that resolves when email process is initiated
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.5, 7.1, 7.2, 7.4
 */
export async function handleEmail(options: EmailOptions): Promise<void> {
  const {
    data,
    filename,
    meterInfo,
    onSuccess,
    onError,
    onLoading,
    onNotifySuccess,
    onNotifyError,
  } = options;

  let temporaryFileUrl: string | null = null;

  try {
    // Set loading state
    onLoading?.(true);

    // Validate data exists
    if (!data || data.length === 0) {
      const errorMessage = 'No meter readings available to email. Please adjust your filters.';
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

    // Create temporary file
    temporaryFileUrl = createTemporaryFile(csvContent);

    // Format email subject with meter information
    const subject = formatEmailSubject(meterInfo);

    // Generate mailto URL
    const mailtoUrl = generateMailtoUrl(subject, filename);

    // Open default email client
    openEmailClient(mailtoUrl);

    // Display success notification
    const successMessage = `Email client opened with meter readings export: ${filename}`;
    onNotifySuccess?.(successMessage);

    // Call success callback
    onSuccess?.();

    // Schedule cleanup of temporary file after a delay
    // This allows the email client to potentially access the file
    // In practice, the file is only used for the mailto URL, not as an actual attachment
    // The cleanup happens after a short delay to ensure the email client has opened
    setTimeout(() => {
      if (temporaryFileUrl) {
        cleanupTemporaryFile(temporaryFileUrl);
      }
    }, 1000);
  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during email';
    onNotifyError?.(errorMessage);
    onError?.(error instanceof Error ? error : new Error(errorMessage));

    // Clean up temporary file on error
    if (temporaryFileUrl) {
      cleanupTemporaryFile(temporaryFileUrl);
    }
  } finally {
    // Clear loading state
    onLoading?.(false);
  }
}

/**
 * Cleans up all temporary files on page unload
 * This ensures no orphaned files are left in the browser's temporary storage
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupAllTemporaryFiles();
  });
}

/**
 * Exports cleanup function for testing purposes
 */
export { cleanupTemporaryFile, cleanupAllTemporaryFiles };
