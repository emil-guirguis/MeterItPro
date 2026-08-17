/**
 * List Component Framework - Export Helpers
 * Provides utilities for CSV generation and download with proper
 * escaping and special character handling.
 */

/**
 * Escape a CSV value to handle special characters properly.
 * Handles quotes, commas, newlines, and other special characters
 * according to RFC 4180 CSV specification.
 * 
 * @param value - Value to escape
 * @returns Escaped CSV value
 * 
 * @example
 * escapeCSVValue('Hello, World') // Returns: '"Hello, World"'
 * escapeCSVValue('Say "Hi"') // Returns: '"Say ""Hi"""'
 * escapeCSVValue('Line 1\nLine 2') // Returns: '"Line 1\nLine 2"'
 */
export const escapeCSVValue = (value: any): string => {
  // Handle null, undefined, or empty values
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert to string
  let stringValue = String(value);
  
  // Check if value needs escaping (contains comma, quote, newline, or carriage return)
  const needsEscaping = /[",\n\r]/.test(stringValue);
  
  if (needsEscaping) {
    // Escape double quotes by doubling them
    stringValue = stringValue.replace(/"/g, '""');
    // Wrap in double quotes
    return `"${stringValue}"`;
  }
  
  return stringValue;
};

/**
 * Generate a CSV string from headers and data rows.
 * Properly escapes all values and formats according to CSV standards.
 * 
 * @param headers - Array of column headers
 * @param rows - Array of data rows (each row is an array of values)
 * @param includeInfo - Optional info text to include at the top of the CSV
 * @returns CSV string ready for download
 * 
 * @example
 * const headers = ['Name', 'Email', 'Status'];
 * const rows = [
 *   ['John Doe', 'john@example.com', 'Active'],
 *   ['Jane Smith', 'jane@example.com', 'Inactive']
 * ];
 * const csv = generateCSV(headers, rows);
 */
export const generateCSV = (
  headers: string[],
  rows: any[][],
  includeInfo?: string
): string => {
  const lines: string[] = [];
  
  // Add info text if provided (as comments)
  if (includeInfo) {
    const infoLines = includeInfo.split('\n');
    infoLines.forEach(line => {
      lines.push(`# ${line}`);
    });
    lines.push(''); // Empty line after info
  }
  
  // Add headers
  const headerLine = headers.map(escapeCSVValue).join(',');
  lines.push(headerLine);
  
  // Add data rows
  rows.forEach(row => {
    const rowLine = row.map(escapeCSVValue).join(',');
    lines.push(rowLine);
  });
  
  // Join with newlines
  return lines.join('\n');
};

/**
 * Download a CSV string as a file.
 * Creates a blob and triggers a download in the browser.
 * 
 * @param csvContent - CSV string content
 * @param filename - Name for the downloaded file
 * 
 * @example
 * const csv = generateCSV(['Name', 'Email'], [['John', 'john@example.com']]);
 * downloadCSV(csv, 'contacts-2024-01-15.csv');
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  // Create a Blob with UTF-8 BOM for proper Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Format a date string for use in filenames.
 * Converts date to YYYY-MM-DD format.
 * 
 * @param date - Date object or undefined (defaults to current date)
 * @returns Formatted date string
 * 
 * @example
 * formatDateForFilename() // Returns: '2024-01-15'
 * formatDateForFilename(new Date('2024-03-20')) // Returns: '2024-03-20'
 */
export const formatDateForFilename = (date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate export info text with timestamp and record count.
 * 
 * @param entityNamePlural - Plural name of the entity (e.g., 'contacts')
 * @param count - Number of records being exported
 * @returns Formatted info text
 * 
 * @example
 * generateExportInfo('contacts', 150)
 * // Returns: 'Exported 150 contacts on 2024-01-15 at 10:30 AM'
 */
export const generateExportInfo = (entityNamePlural: string, count: number): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `Exported ${count} ${entityNamePlural} on ${dateStr} at ${timeStr}`;
};
