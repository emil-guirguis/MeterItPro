/**
 * Filename Formatter Utility
 * 
 * Generates user-friendly filenames for exported CSV files with:
 * - Format: [YYYY-MM-DD]_Meter_Readings_[elementName].csv
 * - Special character handling for filesystem compatibility
 * - Filesystem-safe output
 * 
 * Feature: meter-reading-export
 * Requirements: 1.3
 */

/**
 * Replaces special characters in a filename with underscores to ensure filesystem compatibility
 * 
 * Removes or replaces characters that are invalid in filenames across different operating systems:
 * - Windows: < > : " / \ | ? *
 * - macOS/Linux: / (null character)
 * - All systems: control characters
 * - Also replaces spaces with underscores for consistency
 * 
 * @param name - The element name to sanitize
 * @returns Sanitized filename-safe string
 */
function sanitizeFilename(name: string): string {
  if (!name) {
    return 'Unknown';
  }

  // Replace invalid filename characters and spaces with underscores
  // Invalid characters: < > : " / \ | ? * space and control characters
  const sanitized = name
    .replace(/[<>:"/\\|?*\s\x00-\x1f]/g, '_')
    // Replace multiple consecutive underscores with a single underscore
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  // If the result is empty after sanitization, use a default name
  return sanitized || 'Unknown';
}

/**
 * Formats a date to YYYY-MM-DD format
 * 
 * @param date - The date to format (defaults to today if not provided or invalid)
 * @returns Formatted date string in YYYY-MM-DD format
 */
function formatDate(date?: Date): string {
  let targetDate = date;
  
  // Check if date is valid
  if (!targetDate || isNaN(targetDate.getTime())) {
    targetDate = new Date();
  }
  
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Generates a user-friendly filename for exported CSV files
 * 
 * Format: [YYYY-MM-DD]_Meter_Readings_[elementName].csv
 * Example: "2024-01-15_Meter_Readings_Main_Pump.csv"
 * 
 * Features:
 * - Formats date as YYYY-MM-DD
 * - Handles special characters in element names
 * - Ensures filesystem-safe output
 * - Uses provided date or defaults to today
 * 
 * @param elementName - The name of the meter element (e.g., "Main Pump", "Building A")
 * @param currentDate - Optional date to use in filename (defaults to today)
 * @returns Formatted filename string
 * 
 * Validates: Requirements 1.3
 */
export function formatExportFilename(elementName: string, currentDate?: Date): string {
  const formattedDate = formatDate(currentDate);
  const sanitizedElementName = sanitizeFilename(elementName);
  
  return `${formattedDate}_Meter_Readings_${sanitizedElementName}.csv`;
}
