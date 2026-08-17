/**
 * Email Subject Line Formatter Utility
 * 
 * Formats email subject lines with meter information for export operations.
 * 
 * Feature: meter-reading-export
 * Requirements: 2.4
 */

/**
 * Formats the email subject line with meter information
 * 
 * The format includes:
 * - "Meter Readings Export" prefix
 * - Meter information (name and element name)
 * - Current date in YYYY-MM-DD format
 * 
 * Example: "Meter Readings Export - Main Pump (2024-01-15)"
 * 
 * @param meterInfo - The meter information to include in subject (e.g., "Main Pump" or "Building A - Floor 3")
 * @param currentDate - Optional date to use for formatting (defaults to today)
 * @returns Formatted subject line string
 * 
 * Validates: Requirements 2.4
 */
export function formatEmailSubject(meterInfo: string, currentDate?: Date): string {
  // Use provided date or default to today
  const date = currentDate || new Date();
  
  // Format date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Return formatted subject line
  return `Meter Readings Export - ${meterInfo} (${dateStr})`;
}
