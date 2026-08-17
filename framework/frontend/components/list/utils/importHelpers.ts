/**
 * List Component Framework - Import Helpers
 * Provides utilities for CSV parsing, validation, and import template generation.
 */

import type { ValidationResult } from '../types/list';
import { generateCSV, downloadCSV } from './exportHelpers';

/**
 * Parse a CSV file content into rows of data.
 * Handles quoted values, escaped quotes, and newlines within fields.
 * 
 * @param csvContent - Raw CSV file content as string
 * @returns Array of rows, where each row is an array of values
 * 
 * @example
 * const csv = 'Name,Email\n"John Doe",john@example.com\n"Jane Smith",jane@example.com';
 * const rows = parseCSV(csv);
 * // Returns: [
 * //   ['Name', 'Email'],
 * //   ['John Doe', 'john@example.com'],
 * //   ['Jane Smith', 'jane@example.com']
 * // ]
 */
export const parseCSV = (csvContent: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  let i = 0;
  
  // Remove BOM if present
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1);
  }
  
  while (i < csvContent.length) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];
    
    if (insideQuotes) {
      // Inside quoted field
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        // Regular character inside quotes
        currentValue += char;
        i++;
      }
    } else {
      // Outside quoted field
      if (char === '"') {
        // Start of quoted field
        insideQuotes = true;
        i++;
      } else if (char === ',') {
        // Field separator
        currentRow.push(currentValue.trim());
        currentValue = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        // Row separator
        if (currentValue || currentRow.length > 0) {
          currentRow.push(currentValue.trim());
          rows.push(currentRow);
          currentRow = [];
          currentValue = '';
        }
        // Skip \r\n combination
        if (char === '\r' && nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
      } else {
        // Regular character
        currentValue += char;
        i++;
      }
    }
  }
  
  // Add last value and row if not empty
  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }
  
  // Filter out empty rows and comment rows (starting with #)
  return rows.filter(row => {
    if (row.length === 0) return false;
    if (row.length === 1 && row[0] === '') return false;
    if (row[0].startsWith('#')) return false;
    return true;
  });
};

/**
 * Validate import data structure and content.
 * Checks for required headers, row consistency, and basic data validation.
 * 
 * @param rows - Parsed CSV rows
 * @param expectedHeaders - Expected header names
 * @param validateRow - Optional function to validate each data row
 * @returns Validation result with any errors
 * 
 * @example
 * const rows = [['Name', 'Email'], ['John', 'john@example.com']];
 * const result = validateImportData(rows, ['Name', 'Email']);
 */
export const validateImportData = (
  rows: string[][],
  expectedHeaders: string[],
  validateRow?: (row: string[], rowIndex: number) => ValidationResult
): ValidationResult => {
  const errors: string[] = [];
  
  // Check if file has data
  if (rows.length === 0) {
    return {
      valid: false,
      errors: ['File is empty or contains no valid data']
    };
  }
  
  // Check headers
  const headers = rows[0];
  if (headers.length !== expectedHeaders.length) {
    errors.push(
      `Invalid number of columns. Expected ${expectedHeaders.length}, found ${headers.length}`
    );
  }
  
  // Check each expected header
  expectedHeaders.forEach((expectedHeader, index) => {
    const actualHeader = headers[index]?.trim();
    if (actualHeader !== expectedHeader) {
      errors.push(
        `Column ${index + 1}: Expected "${expectedHeader}", found "${actualHeader}"`
      );
    }
  });
  
  // If headers are invalid, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Validate data rows if validator provided
  if (validateRow) {
    const dataRows = rows.slice(1); // Skip header row
    
    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because: +1 for header, +1 for 1-based indexing
      
      // Check column count
      if (row.length !== expectedHeaders.length) {
        errors.push(
          `Row ${rowNumber}: Invalid number of columns. Expected ${expectedHeaders.length}, found ${row.length}`
        );
        return;
      }
      
      // Custom validation
      const rowValidation = validateRow(row, rowNumber);
      if (!rowValidation.valid && rowValidation.errors) {
        rowValidation.errors.forEach(error => {
          errors.push(`Row ${rowNumber}: ${error}`);
        });
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Generate and download a CSV template file for import.
 * Creates a template with headers and optional example rows.
 * 
 * @param filename - Name for the template file
 * @param headers - Column headers
 * @param exampleRows - Optional example data rows
 * @param instructions - Optional instructions to include as comments
 * 
 * @example
 * generateImportTemplate(
 *   'contacts-template.csv',
 *   ['Name', 'Email', 'Phone'],
 *   [['John Doe', 'john@example.com', '555-0100']],
 *   'Fill in your contact information below'
 * );
 */
export const generateImportTemplate = (
  filename: string,
  headers: string[],
  exampleRows?: string[][],
  instructions?: string
): void => {
  const rows = exampleRows || [];
  const info = instructions || 'Import Template - Fill in your data below';
  
  const csvContent = generateCSV(headers, rows, info);
  downloadCSV(csvContent, filename);
};

/**
 * Read a file as text content.
 * Returns a promise that resolves with the file content.
 * 
 * @param file - File object to read
 * @returns Promise resolving to file content as string
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Validate file before processing.
 * Checks file type, size, and extension.
 * 
 * @param file - File to validate
 * @param maxSize - Maximum file size in bytes (default: 5MB)
 * @param allowedExtensions - Allowed file extensions (default: ['.csv'])
 * @returns Validation result
 */
export const validateFile = (
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  allowedExtensions: string[] = ['.csv']
): ValidationResult => {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => 
    fileName.endsWith(ext.toLowerCase())
  );
  
  if (!hasValidExtension) {
    errors.push(
      `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
    );
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Process CSV import with validation and error handling.
 * Combines file reading, parsing, and validation into a single operation.
 * 
 * @param file - File to import
 * @param expectedHeaders - Expected CSV headers
 * @param validateRow - Function to validate each row
 * @param maxSize - Maximum file size in bytes
 * @param allowedExtensions - Allowed file extensions
 * @returns Promise resolving to parsed and validated rows (excluding header)
 */
export const processImportFile = async (
  file: File,
  expectedHeaders: string[],
  validateRow?: (row: string[], rowIndex: number) => ValidationResult,
  maxSize?: number,
  allowedExtensions?: string[]
): Promise<{ rows: string[][]; errors?: string[] }> => {
  // Validate file
  const fileValidation = validateFile(file, maxSize, allowedExtensions);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.errors?.join('\n'));
  }
  
  // Read file content
  const content = await readFileAsText(file);
  
  // Parse CSV
  const rows = parseCSV(content);
  
  // Validate data
  const dataValidation = validateImportData(rows, expectedHeaders, validateRow);
  if (!dataValidation.valid) {
    throw new Error(dataValidation.errors?.join('\n'));
  }
  
  // Return data rows (excluding header)
  return {
    rows: rows.slice(1),
    errors: dataValidation.errors
  };
};
