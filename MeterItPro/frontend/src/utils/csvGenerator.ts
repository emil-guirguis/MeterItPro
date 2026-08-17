/**
 * CSV Generator Utility
 * 
 * Converts meter reading data to properly formatted CSV with:
 * - Header row with column names
 * - Proper escaping of special characters (commas, quotes, newlines)
 * - UTF-8 encoding
 * - Data sorted by created_at in descending order (newest first)
 * 
 * Feature: meter-reading-export
 * Requirements: 1.2, 4.1, 4.2, 4.3, 4.4
 */

/**
 * Meter Reading interface representing a single meter reading record
 */
export interface MeterReading {
  meter_reading_id?: number;
  meter_id?: number;
  tenant_id?: number;
  created_at?: string;
  meter_element_id?: number;
  kw?: number;
  kwh?: number;
  pf?: number;
  amperage?: number;
  voltage_p_n?: number;
  [key: string]: any;
}

/**
 * Escapes a CSV field value by:
 * - Wrapping in quotes if it contains special characters
 * - Escaping internal quotes by doubling them
 * - Handling newlines and commas
 * 
 * @param value - The field value to escape
 * @returns The escaped field value
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if field contains special characters that require quoting
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    // Wrap in quotes
    return `"${escapedValue}"`;
  }

  return stringValue;
}

/**
 * Generates a CSV string from an array of meter readings
 * 
 * Features:
 * - Includes all meter reading columns in output
 * - Adds header row with column names
 * - Properly escapes special characters (commas, quotes, newlines)
 * - Sorts data by created_at in descending order (newest first)
 * - Uses UTF-8 encoding
 * 
 * @param readings - Array of meter reading objects to convert to CSV
 * @returns CSV formatted string with UTF-8 encoding
 * 
 * Validates: Requirements 1.2, 4.1, 4.2, 4.3, 4.4
 */
export function generateCSV(readings: MeterReading[]): string {
  if (!readings || readings.length === 0) {
    return '';
  }

  // Sort readings by created_at in descending order (newest first)
  const sortedReadings = [...readings].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  // Collect all unique column names from all readings
  const columnSet = new Set<string>();
  sortedReadings.forEach(reading => {
    Object.keys(reading).forEach(key => columnSet.add(key));
  });

  // Convert to array and sort for consistent column ordering
  const columns = Array.from(columnSet).sort();

  // Create header row
  const headerRow = columns.map(col => escapeCSVField(col)).join(',');

  // Create data rows
  const dataRows = sortedReadings.map(reading => {
    return columns.map(col => escapeCSVField(reading[col])).join(',');
  });

  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Return as UTF-8 encoded string
  return csvContent;
}
