/**
 * Export Helpers - Provides utilities for CSV generation and download
 */

/**
 * Escape a CSV value to handle special characters properly.
 */
export const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  let stringValue = String(value);
  const needsEscaping = /[",\n\r]/.test(stringValue);
  
  if (needsEscaping) {
    stringValue = stringValue.replace(/"/g, '""');
    return `"${stringValue}"`;
  }
  
  return stringValue;
};

/**
 * Generate a CSV string from headers and data rows.
 */
export const generateCSV = (
  headers: string[],
  rows: any[][],
  includeInfo?: string
): string => {
  const lines: string[] = [];
  
  if (includeInfo) {
    const infoLines = includeInfo.split('\n');
    infoLines.forEach(line => {
      lines.push(`# ${line}`);
    });
    lines.push('');
  }
  
  const headerLine = headers.map(escapeCSVValue).join(',');
  lines.push(headerLine);
  
  rows.forEach(row => {
    const rowLine = row.map(escapeCSVValue).join(',');
    lines.push(rowLine);
  });
  
  return lines.join('\n');
};

/**
 * Download a CSV string as a file.
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Format a date string for use in filenames.
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
