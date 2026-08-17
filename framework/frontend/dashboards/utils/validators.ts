/**
 * Dashboard Validators
 * 
 * Utility functions for validating dashboard data, configurations, and user inputs
 */

/**
 * Validate a dashboard card object
 * 
 * @param card - Card object to validate
 * @returns Validation result with errors array
 */
export function validateDashboardCard(card: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!card) {
    errors.push('Card object is required');
    return { valid: false, errors };
  }

  // Check required fields
  if (!card.id && card.id !== 0) {
    errors.push('Card ID is required');
  }

  if (!card.title || typeof card.title !== 'string' || card.title.trim() === '') {
    errors.push('Card title is required and must be a non-empty string');
  }

  if (!card.visualization_type) {
    errors.push('Visualization type is required');
  } else {
    const validTypes = ['pie', 'line', 'bar', 'area', 'candlestick'];
    if (!validTypes.includes(card.visualization_type)) {
      errors.push(`Invalid visualization type: ${card.visualization_type}`);
    }
  }

  // Check optional grid properties
  if (card.grid_x !== undefined && (typeof card.grid_x !== 'number' || card.grid_x < 1)) {
    errors.push('Grid X must be a positive number');
  }

  if (card.grid_y !== undefined && (typeof card.grid_y !== 'number' || card.grid_y < 1)) {
    errors.push('Grid Y must be a positive number');
  }

  if (card.grid_w !== undefined && (typeof card.grid_w !== 'number' || card.grid_w < 1)) {
    errors.push('Grid width must be a positive number');
  }

  if (card.grid_h !== undefined && (typeof card.grid_h !== 'number' || card.grid_h < 1)) {
    errors.push('Grid height must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate aggregated data object
 * 
 * @param data - Data object to validate
 * @returns Validation result with errors array
 */
export function validateAggregatedData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Data object is required');
    return { valid: false, errors };
  }

  if (!data.card_id && data.card_id !== 0) {
    errors.push('Card ID is required');
  }

  if (!data.aggregated_values || typeof data.aggregated_values !== 'object') {
    errors.push('Aggregated values must be an object');
  } else if (Object.keys(data.aggregated_values).length === 0) {
    errors.push('Aggregated values cannot be empty');
  } else {
    // Validate all values are numbers
    for (const [key, value] of Object.entries(data.aggregated_values)) {
      if (typeof value !== 'number') {
        errors.push(`Aggregated value "${key}" must be a number, got ${typeof value}`);
      }
    }
  }

  if (data.grouped_data !== undefined) {
    if (!Array.isArray(data.grouped_data)) {
      errors.push('Grouped data must be an array');
    } else if (data.grouped_data.length > 0) {
      // Validate array items are objects
      for (let i = 0; i < data.grouped_data.length; i++) {
        if (typeof data.grouped_data[i] !== 'object' || data.grouped_data[i] === null) {
          errors.push(`Grouped data item at index ${i} must be an object`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate dashboard layout configuration
 * 
 * @param layout - Layout object to validate
 * @returns Validation result with errors array
 */
export function validateDashboardLayout(layout: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!layout) {
    errors.push('Layout object is required');
    return { valid: false, errors };
  }

  if (typeof layout.columns !== 'number' || layout.columns < 1) {
    errors.push('Columns must be a positive number');
  }

  if (layout.rows !== undefined && (typeof layout.rows !== 'number' || layout.rows < 1)) {
    errors.push('Rows must be a positive number');
  }

  if (layout.gap === undefined) {
    errors.push('Gap is required');
  } else if (typeof layout.gap !== 'number' && typeof layout.gap !== 'string') {
    errors.push('Gap must be a number or string');
  }

  if (layout.breakpoints !== undefined) {
    if (!Array.isArray(layout.breakpoints)) {
      errors.push('Breakpoints must be an array');
    } else {
      for (let i = 0; i < layout.breakpoints.length; i++) {
        const bp = layout.breakpoints[i];
        if (!bp.name || typeof bp.name !== 'string') {
          errors.push(`Breakpoint ${i}: name is required and must be a string`);
        }
        if (typeof bp.maxWidth !== 'number' || bp.maxWidth < 0) {
          errors.push(`Breakpoint ${i}: maxWidth must be a non-negative number`);
        }
        if (typeof bp.columns !== 'number' || bp.columns < 1) {
          errors.push(`Breakpoint ${i}: columns must be a positive number`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a number value
 * 
 * @param value - Value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns Validation result with errors array
 */
export function validateNumber(
  value: any,
  min?: number,
  max?: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push('Value must be a valid number');
    return { valid: false, errors };
  }

  if (min !== undefined && value < min) {
    errors.push(`Value must be at least ${min}`);
  }

  if (max !== undefined && value > max) {
    errors.push(`Value must be at most ${max}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a string value
 * 
 * @param value - Value to validate
 * @param minLength - Minimum string length
 * @param maxLength - Maximum string length
 * @param pattern - Optional regex pattern to match
 * @returns Validation result with errors array
 */
export function validateString(
  value: any,
  minLength?: number,
  maxLength?: number,
  pattern?: RegExp
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof value !== 'string') {
    errors.push('Value must be a string');
    return { valid: false, errors };
  }

  if (minLength !== undefined && value.length < minLength) {
    errors.push(`String must be at least ${minLength} characters`);
  }

  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(`String must be at most ${maxLength} characters`);
  }

  if (pattern && !pattern.test(value)) {
    errors.push(`String does not match required pattern: ${pattern}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an array value
 * 
 * @param value - Value to validate
 * @param minLength - Minimum array length
 * @param maxLength - Maximum array length
 * @param itemValidator - Optional function to validate each item
 * @returns Validation result with errors array
 */
export function validateArray<T>(
  value: any,
  minLength?: number,
  maxLength?: number,
  itemValidator?: (item: T, index: number) => { valid: boolean; errors: string[] }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(value)) {
    errors.push('Value must be an array');
    return { valid: false, errors };
  }

  if (minLength !== undefined && value.length < minLength) {
    errors.push(`Array must have at least ${minLength} items`);
  }

  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(`Array must have at most ${maxLength} items`);
  }

  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i], i);
      if (!result.valid) {
        errors.push(`Item ${i}: ${result.errors.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an object has required keys
 * 
 * @param obj - Object to validate
 * @param requiredKeys - Array of required key names
 * @returns Validation result with errors array
 */
export function validateRequiredKeys(
  obj: any,
  requiredKeys: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof obj !== 'object' || obj === null) {
    errors.push('Value must be an object');
    return { valid: false, errors };
  }

  for (const key of requiredKeys) {
    if (!(key in obj)) {
      errors.push(`Required key "${key}" is missing`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a date value
 * 
 * @param value - Value to validate
 * @param minDate - Minimum allowed date
 * @param maxDate - Maximum allowed date
 * @returns Validation result with errors array
 */
export function validateDate(
  value: any,
  minDate?: Date,
  maxDate?: Date
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  let dateObj: Date;

  if (typeof value === 'string') {
    dateObj = new Date(value);
  } else if (value instanceof Date) {
    dateObj = value;
  } else {
    errors.push('Value must be a Date object or ISO date string');
    return { valid: false, errors };
  }

  if (isNaN(dateObj.getTime())) {
    errors.push('Invalid date value');
    return { valid: false, errors };
  }

  if (minDate && dateObj < minDate) {
    errors.push(`Date must be after ${minDate.toISOString()}`);
  }

  if (maxDate && dateObj > maxDate) {
    errors.push(`Date must be before ${maxDate.toISOString()}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an email address
 * 
 * @param value - Email to validate
 * @returns Validation result with errors array
 */
export function validateEmail(value: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof value !== 'string') {
    errors.push('Email must be a string');
    return { valid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    errors.push('Invalid email format');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a URL
 * 
 * @param value - URL to validate
 * @returns Validation result with errors array
 */
export function validateUrl(value: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof value !== 'string') {
    errors.push('URL must be a string');
    return { valid: false, errors };
  }

  try {
    new URL(value);
  } catch {
    errors.push('Invalid URL format');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Combine multiple validation results
 * 
 * @param results - Array of validation results
 * @returns Combined validation result
 */
export function combineValidationResults(
  results: Array<{ valid: boolean; errors: string[] }>
): { valid: boolean; errors: string[] } {
  const allErrors = results.flatMap(r => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}
