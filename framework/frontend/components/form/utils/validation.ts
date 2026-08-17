import type { ValidationRule } from '../types/form';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation regex
 */
const URL_REGEX = /^https?:\/\/.+/;

/**
 * Phone validation regex (flexible format)
 */
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

/**
 * US ZIP code validation regex
 */
const US_ZIP_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Validate a single field value against validation rules
 */
export function validateField(
  value: any,
  rules: ValidationRule[],
  formData?: any
): string | undefined {
  for (const rule of rules) {
    const error = validateRule(value, rule, formData);
    if (error) {
      return error;
    }
  }
  return undefined;
}

/**
 * Validate a value against a single validation rule
 */
export function validateRule(
  value: any,
  rule: ValidationRule,
  formData?: any
): string | undefined {
  switch (rule.type) {
    case 'required':
      return validateRequired(value, rule.message);

    case 'email':
      return validateEmail(value, rule.message);

    case 'url':
      return validateUrl(value, rule.message);

    case 'phone':
      return validatePhone(value, rule.message);

    case 'zipCode':
      return validateZipCode(value, rule.message);

    case 'min':
      return validateMin(value, rule.value, rule.message);

    case 'max':
      return validateMax(value, rule.value, rule.message);

    case 'minLength':
      return validateMinLength(value, rule.value, rule.message);

    case 'maxLength':
      return validateMaxLength(value, rule.value, rule.message);

    case 'pattern':
      return validatePattern(value, rule.value, rule.message);

    case 'custom':
      return validateCustom(value, rule.validator, rule.message, formData);

    default:
      return undefined;
  }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, message: string): string | undefined {
  if (value === null || value === undefined || value === '') {
    return message;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return message;
  }
  if (Array.isArray(value) && value.length === 0) {
    return message;
  }
  return undefined;
}

/**
 * Validate email format
 */
export function validateEmail(value: any, message: string): string | undefined {
  if (!value) return undefined; // Skip if empty (use 'required' rule for that)
  if (typeof value !== 'string') return message;
  if (!EMAIL_REGEX.test(value)) {
    return message;
  }
  return undefined;
}

/**
 * Validate URL format
 */
export function validateUrl(value: any, message: string): string | undefined {
  if (!value) return undefined; // Skip if empty
  if (typeof value !== 'string') return message;
  
  try {
    new URL(value);
    if (!URL_REGEX.test(value)) {
      return message;
    }
    return undefined;
  } catch {
    return message;
  }
}

/**
 * Validate phone number format
 */
export function validatePhone(value: any, message: string): string | undefined {
  if (!value) return undefined; // Skip if empty
  if (typeof value !== 'string') return message;
  
  // Remove common formatting characters for validation
  const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
  if (!PHONE_REGEX.test(cleaned)) {
    return message;
  }
  return undefined;
}

/**
 * Validate ZIP code format (US)
 */
export function validateZipCode(value: any, message: string): string | undefined {
  if (!value) return undefined; // Skip if empty
  if (typeof value !== 'string') return message;
  if (!US_ZIP_REGEX.test(value)) {
    return message;
  }
  return undefined;
}

/**
 * Validate minimum value (for numbers)
 */
export function validateMin(value: any, min: number, message: string): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue) || numValue < min) {
    return message;
  }
  return undefined;
}

/**
 * Validate maximum value (for numbers)
 */
export function validateMax(value: any, max: number, message: string): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue) || numValue > max) {
    return message;
  }
  return undefined;
}

/**
 * Validate minimum length (for strings)
 */
export function validateMinLength(value: any, minLength: number, message: string): string | undefined {
  if (!value) return undefined; // Skip if empty
  if (typeof value !== 'string') return message;
  if (value.length < minLength) {
    return message;
  }
  return undefined;
}

/**
 * Validate maximum length (for strings)
 */
export function validateMaxLength(value: any, maxLength: number, message: string): string | undefined {
  if (!value) return undefined; // Skip if empty
  if (typeof value !== 'string') return message;
  if (value.length > maxLength) {
    return message;
  }
  return undefined;
}

/**
 * Validate against a regex pattern
 */
export function validatePattern(value: any, pattern: RegExp | string, message: string): string | undefined {
  if (!value) return undefined; // Skip if empty
  if (typeof value !== 'string') return message;
  
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  if (!regex.test(value)) {
    return message;
  }
  return undefined;
}

/**
 * Validate using a custom validator function
 */
export function validateCustom(
  value: any,
  validator: ((value: any, formData?: any) => boolean) | undefined,
  message: string,
  formData?: any
): string | undefined {
  if (!validator) return undefined;
  
  try {
    const isValid = validator(value, formData);
    if (!isValid) {
      return message;
    }
    return undefined;
  } catch (error) {
    console.error('Custom validator error:', error);
    return message;
  }
}

/**
 * Helper to create common validation rules
 */
export const validators = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    type: 'url',
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    type: 'phone',
    message,
  }),

  zipCode: (message = 'Please enter a valid ZIP code'): ValidationRule => ({
    type: 'zipCode',
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    type: 'min',
    value: min,
    message: message || `Value must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    type: 'max',
    value: max,
    message: message || `Value must be at most ${max}`,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: length,
    message: message || `Must be at most ${length} characters`,
  }),

  pattern: (pattern: RegExp | string, message: string): ValidationRule => ({
    type: 'pattern',
    value: pattern,
    message,
  }),

  custom: (validator: (value: any, formData?: any) => boolean, message: string): ValidationRule => ({
    type: 'custom',
    validator,
    message,
  }),
};
