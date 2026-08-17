/**
 * Import Helpers - Provides utilities for CSV parsing and import
 */

import { generateCSV, downloadCSV } from './exportHelpers';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Parse a CSV file content into rows of data.
 */
export const parseCSV = (csvContent: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  let i = 0;
  
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1);
  }
  
  while (i < csvContent.length) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];
    
    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentValue += '"';
          i += 2;
          continue;
        } else {
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentValue += char;
        i++;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentValue.trim());
        currentValue = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        if (currentValue || currentRow.length > 0) {
          currentRow.push(currentValue.trim());
          rows.push(currentRow);
          currentRow = [];
          currentValue = '';
        }
        if (char === '\r' && nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
      } else {
        currentValue += char;
        i++;
      }
    }
  }
  
  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }
  
  return rows.filter(row => {
    if (row.length === 0) return false;
    if (row.length === 1 && row[0] === '') return false;
    if (row[0].startsWith('#')) return false;
    return true;
  });
};

/**
 * Validate import data structure and content.
 */
export const validateImportData = (
  rows: string[][],
  expectedHeaders: string[],
  validateRow?: (row: string[], rowIndex: number) => ValidationResult
): ValidationResult => {
  const errors: string[] = [];
  
  if (rows.length === 0) {
    return {
      valid: false,
      errors: ['File is empty or contains no valid data']
    };
  }
  
  const headers = rows[0];
  if (headers.length !== expectedHeaders.length) {
    errors.push(
      `Invalid number of columns. Expected ${expectedHeaders.length}, found ${headers.length}`
    );
  }
  
  expectedHeaders.forEach((expectedHeader, index) => {
    const actualHeader = headers[index]?.trim();
    if (actualHeader !== expectedHeader) {
      errors.push(
        `Column ${index + 1}: Expected "${expectedHeader}", found "${actualHeader}"`
      );
    }
  });
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  if (validateRow) {
    const dataRows = rows.slice(1);
    
    dataRows.forEach((row, index) => {
      const rowNumber = index + 2;
      
      if (row.length !== expectedHeaders.length) {
        errors.push(
          `Row ${rowNumber}: Invalid number of columns. Expected ${expectedHeaders.length}, found ${row.length}`
        );
        return;
      }
      
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
 */
export const validateFile = (
  file: File,
  maxSize: number = 5 * 1024 * 1024,
  allowedExtensions: string[] = ['.csv']
): ValidationResult => {
  const errors: string[] = [];
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
  }
  
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
 */
export const processImportFile = async (
  file: File,
  expectedHeaders: string[],
  validateRow?: (row: string[], rowIndex: number) => ValidationResult,
  maxSize?: number,
  allowedExtensions?: string[]
): Promise<{ rows: string[][]; errors?: string[] }> => {
  const fileValidation = validateFile(file, maxSize, allowedExtensions);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.errors?.join('\n'));
  }
  
  const content = await readFileAsText(file);
  const rows = parseCSV(content);
  
  const dataValidation = validateImportData(rows, expectedHeaders, validateRow);
  if (!dataValidation.valid) {
    throw new Error(dataValidation.errors?.join('\n'));
  }
  
  return {
    rows: rows.slice(1),
    errors: dataValidation.errors
  };
};
