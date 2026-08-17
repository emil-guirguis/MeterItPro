/**
 * Form data transformation utilities
 */

/**
 * Transform form values by trimming string fields
 */
export function trimStringFields<T extends Record<string, any>>(values: T): T {
  const result = { ...values };
  
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = result[key].trim() as any;
    } else if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = trimStringFields(result[key]);
    }
  }
  
  return result;
}

/**
 * Remove empty string fields from form values
 */
export function removeEmptyStrings<T extends Record<string, any>>(values: T): Partial<T> {
  const result: any = {};
  
  for (const key in values) {
    const value = values[key];
    if (value === '') {
      continue; // Skip empty strings
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = removeEmptyStrings(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Remove null and undefined fields from form values
 */
export function removeNullish<T extends Record<string, any>>(values: T): Partial<T> {
  const result: any = {};
  
  for (const key in values) {
    const value = values[key];
    if (value === null || value === undefined) {
      continue; // Skip null/undefined
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = removeNullish(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Convert empty strings to null
 */
export function emptyStringsToNull<T extends Record<string, any>>(values: T): T {
  const result = { ...values };
  
  for (const key in result) {
    if (result[key] === '') {
      result[key] = null as any;
    } else if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = emptyStringsToNull(result[key]);
    }
  }
  
  return result;
}

/**
 * Normalize email to lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize phone number by removing formatting
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, '');
}

/**
 * Format phone number for display (US format)
 */
export function formatPhone(phone: string): string {
  const cleaned = normalizePhone(phone);
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if format doesn't match
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convert form data to FormData object (for file uploads)
 */
export function toFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  for (const key in data) {
    const value = data[key];
    
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File || item instanceof Blob) {
          formData.append(`${key}[${index}]`, item);
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value && typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  }
  
  return formData;
}

/**
 * Deep clone form values
 */
export function cloneFormValues<T>(values: T): T {
  return JSON.parse(JSON.stringify(values));
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation
 */
export function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  
  target[lastKey] = value;
  return obj;
}

/**
 * Compare two form value objects for equality
 */
export function areValuesEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Get changed fields between two form value objects
 */
export function getChangedFields<T extends Record<string, any>>(
  original: T,
  current: T
): Partial<T> {
  const changes: any = {};
  
  for (const key in current) {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      changes[key] = current[key];
    }
  }
  
  return changes;
}

/**
 * Prepare form data for submission
 * Trims strings, removes empty values, normalizes email
 */
export function prepareFormData<T extends Record<string, any>>(
  values: T,
  options: {
    trimStrings?: boolean;
    removeEmpty?: boolean;
    normalizeEmail?: boolean;
    emailFields?: string[];
  } = {}
): Partial<T> {
  const {
    trimStrings = true,
    removeEmpty = false,
    normalizeEmail: shouldNormalizeEmail = true,
    emailFields = ['email'],
  } = options;

  let result = { ...values };

  // Trim strings
  if (trimStrings) {
    result = trimStringFields(result);
  }

  // Normalize email fields
  if (shouldNormalizeEmail) {
    emailFields.forEach(field => {
      if ((result as any)[field] && typeof (result as any)[field] === 'string') {
        (result as any)[field] = normalizeEmail((result as any)[field]);
      }
    });
  }

  // Remove empty values
  if (removeEmpty) {
    result = removeEmptyStrings(result) as T;
  }

  return result;
}
