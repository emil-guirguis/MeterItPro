/**
 * Utility for extracting numeric values from BACnet responses
 * Handles various response structures and formats
 */

/**
 * Extract a numeric value from a BACnet response
 * 
 * Handles multiple value structures:
 * - Primitive numbers: 123.45
 * - Objects with value property: {value: 123.45}
 * - Objects with value property containing object: {value: {value: 123.45}}
 * - Arrays with objects: [{value: 123.45, type: 4}]
 * - Nested structures
 * 
 * @param rawValue - The raw value from BACnet response
 * @param logger - Optional logger for debugging
 * @returns The extracted numeric value, or null if extraction fails
 */
export function extractNumericValue(rawValue: any, logger?: any): number | null {
  const log = logger || console;

  // Handle null/undefined
  if (rawValue === null || rawValue === undefined) {
    log.debug('Value extraction: null or undefined input');
    return null;
  }

  // Handle primitive numbers
  if (typeof rawValue === 'number') {
    if (isNaN(rawValue)) {
      log.debug('Value extraction: NaN input');
      return null;
    }
    log.debug(`Value extraction: primitive number ${rawValue}`);
    return rawValue;
  }

  // Handle strings that might be numbers
  if (typeof rawValue === 'string') {
    const converted = Number(rawValue);
    if (!isNaN(converted)) {
      log.debug(`Value extraction: string converted to number ${converted}`);
      return converted;
    }
    log.debug(`Value extraction: string is not numeric: ${rawValue}`);
    return null;
  }

  // Handle objects and arrays
  if (typeof rawValue === 'object') {
    // Case 1: Array with objects - [{value: 123.45, type: 4}]
    if (Array.isArray(rawValue)) {
      if (rawValue.length === 0) {
        log.debug('Value extraction: empty array');
        return null;
      }

      const firstElement = rawValue[0];
      
      // If first element is a number, use it
      if (typeof firstElement === 'number') {
        if (!isNaN(firstElement)) {
          log.debug(`Value extraction: array with numeric first element ${firstElement}`);
          return firstElement;
        }
      }

      // If first element is an object, try to extract value from it
      if (typeof firstElement === 'object' && firstElement !== null) {
        const extracted = extractFromObject(firstElement, log);
        if (extracted !== null) {
          log.debug(`Value extraction: array with object, extracted ${extracted}`);
          return extracted;
        }
      }

      log.debug(`Value extraction: array with non-extractable first element: ${JSON.stringify(firstElement)}`);
      return null;
    }

    // Case 2: Object with value property - {value: 123.45} or {value: {value: 123.45}}
    const extracted = extractFromObject(rawValue, log);
    if (extracted !== null) {
      log.debug(`Value extraction: object, extracted ${extracted}`);
      return extracted;
    }

    log.debug(`Value extraction: object with no extractable value: ${JSON.stringify(rawValue)}`);
    return null;
  }

  // Fallback: try to convert to number
  const converted = Number(rawValue);
  if (!isNaN(converted)) {
    log.debug(`Value extraction: fallback conversion to number ${converted}`);
    return converted;
  }

  log.debug(`Value extraction: unable to extract value from: ${JSON.stringify(rawValue)}`);
  return null;
}

/**
 * Extract numeric value from an object
 * Recursively handles nested value properties
 */
function extractFromObject(obj: any, logger?: any): number | null {
  const log = logger || console;

  if (!obj || typeof obj !== 'object') {
    return null;
  }

  // Check for 'value' property
  if ('value' in obj) {
    const val = obj.value;

    // If value is a number, return it
    if (typeof val === 'number') {
      if (!isNaN(val)) {
        return val;
      }
      return null;
    }

    // If value is an object, recursively extract
    if (typeof val === 'object' && val !== null) {
      return extractFromObject(val, log);
    }

    // If value is a string, try to convert
    if (typeof val === 'string') {
      const converted = Number(val);
      if (!isNaN(converted)) {
        return converted;
      }
    }
  }

  // Check for '_value' property (alternative naming)
  if ('_value' in obj) {
    const val = obj._value;
    if (typeof val === 'number' && !isNaN(val)) {
      return val;
    }
  }

  // Check for 'data' property (another alternative)
  if ('data' in obj) {
    const val = obj.data;
    if (typeof val === 'number' && !isNaN(val)) {
      return val;
    }
  }

  return null;
}
