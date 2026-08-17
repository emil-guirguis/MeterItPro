/**
 * Reports Framework - CSV Export Utility
 * 
 * Generates CSV reports from report data.
 * Integrates with existing CSV export functionality.
 */

import type { Report, ReportSection } from '../types/report';

/**
 * Generate CSV content from a report
 * 
 * @param report - Report to convert to CSV
 * @returns CSV string content
 */
export function generateCSVReport(report: Report): string {
  const lines: string[] = [];

  // Add report header
  lines.push(`# ${report.title}`);
  if (report.description) {
    lines.push(`# ${report.description}`);
  }
  lines.push(`# Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  
  if (report.metadata?.period) {
    const start = new Date(report.metadata.period.startDate).toLocaleDateString();
    const end = new Date(report.metadata.period.endDate).toLocaleDateString();
    lines.push(`# Period: ${start} - ${end}`);
  }
  
  lines.push(''); // Empty line after header

  // Process each section
  report.template.sections.forEach((section) => {
    const sectionLines = generateSectionCSV(section);
    if (sectionLines.length > 0) {
      lines.push(...sectionLines);
      lines.push(''); // Empty line between sections
    }
  });

  return lines.join('\n');
}

/**
 * Generate CSV content for a report section
 */
function generateSectionCSV(section: ReportSection): string[] {
  const lines: string[] = [];

  // Add section title
  if (section.title) {
    lines.push(`# ${section.title}`);
  }

  switch (section.type) {
    case 'table':
      lines.push(...generateTableCSV(section.content));
      break;

    case 'summary':
      lines.push(...generateSummaryCSV(section.content));
      break;

    case 'text':
    case 'header':
    case 'footer':
      if (typeof section.content === 'string') {
        lines.push(`# ${section.content}`);
      }
      break;

    default:
      // For other types, try to serialize as JSON
      if (section.content) {
        lines.push(`# ${JSON.stringify(section.content)}`);
      }
  }

  return lines;
}

/**
 * Generate CSV for table section
 */
function generateTableCSV(content: any): string[] {
  const lines: string[] = [];

  if (!content.columns || !content.data) {
    return lines;
  }

  const { columns, data } = content;

  // Add headers
  const headers = columns.map((col: any) => escapeCSVValue(col.label));
  lines.push(headers.join(','));

  // Add data rows
  data.forEach((row: any) => {
    const values = columns.map((col: any) => {
      const value = row[col.key];
      const formattedValue = col.format ? col.format(value, row) : value;
      return escapeCSVValue(formattedValue);
    });
    lines.push(values.join(','));
  });

  return lines;
}

/**
 * Generate CSV for summary section
 */
function generateSummaryCSV(content: any[]): string[] {
  const lines: string[] = [];

  if (!Array.isArray(content)) {
    return lines;
  }

  // Add headers
  lines.push('Metric,Value');

  // Add summary items
  content.forEach((item: any) => {
    const label = escapeCSVValue(item.label);
    const value = escapeCSVValue(formatSummaryValue(item));
    lines.push(`${label},${value}`);
  });

  return lines;
}

/**
 * Format summary value based on format type
 */
function formatSummaryValue(summary: any): string {
  const { value, format } = summary;

  if (typeof value === 'number') {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return String(value);
    }
  }

  if (format === 'date' && value) {
    return new Date(value).toLocaleDateString();
  }

  return String(value);
}

/**
 * Escape a CSV value to handle special characters properly.
 * Handles quotes, commas, newlines, and other special characters
 * according to RFC 4180 CSV specification.
 */
export function escapeCSVValue(value: any): string {
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
}

/**
 * Convert report data to CSV format for simple data arrays
 * 
 * @param data - Array of objects to convert
 * @param columns - Optional column definitions
 * @returns CSV string
 */
export function dataToCSV(
  data: any[],
  columns?: Array<{ key: string; label: string; format?: (value: any, row?: any) => string }>
): string {
  if (!data || data.length === 0) {
    return '';
  }

  const lines: string[] = [];

  // Determine columns
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key, format: undefined }));

  // Add headers
  const headers = cols.map((col) => escapeCSVValue(col.label));
  lines.push(headers.join(','));

  // Add data rows
  data.forEach((row) => {
    const values = cols.map((col) => {
      const value = row[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      return escapeCSVValue(formattedValue);
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}
