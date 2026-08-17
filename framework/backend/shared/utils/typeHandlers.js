/**
 * Type Handlers Module
 * 
 * Provides type conversion utilities for mapping between JavaScript and PostgreSQL types.
 * Handles serialization/deserialization of complex types like JSONB and Date objects.
 */

/**
 * Map JavaScript type to PostgreSQL type
 * 
 * @param {*} value - JavaScript value
 * @param {string|null} fieldType - Expected field type from field metadata
 * @returns {string} PostgreSQL type name
 */
function mapJavaScriptToPostgreSQLType(value, fieldType = null) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  // Use field type hint if provided
  if (fieldType) {
    switch (fieldType) {
      case 'string':
        return 'VARCHAR';
      case 'number':
        return Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
      case 'boolean':
        return 'BOOLEAN';
      case 'Date':
        return 'TIMESTAMP';
      case 'Object':
      case 'Array':
        return 'JSONB';
      default:
        // Fall through to infer from value
        break;
    }
  }
  
  // Infer from actual value
  if (typeof value === 'string') {
    return 'VARCHAR';
  }
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
  }
  
  if (typeof value === 'boolean') {
    return 'BOOLEAN';
  }
  
  if (value instanceof Date) {
    return 'TIMESTAMP';
  }
  
  if (Array.isArray(value)) {
    return 'JSONB';
  }
  
  if (typeof value === 'object') {
    return 'JSONB';
  }
  
  return 'VARCHAR'; // Default fallback
}

/**
 * Map PostgreSQL type to JavaScript type
 * 
 * @param {string|null} pgType - PostgreSQL type name
 * @returns {string} JavaScript type name
 */
function mapPostgreSQLToJavaScriptType(pgType) {
  if (!pgType) return 'string';
  const normalizedType = pgType.toUpperCase();
  
  // Integer types
  if (normalizedType.includes('INT') || normalizedType.includes('SERIAL')) {
    return 'number';
  }
  
  // Numeric/decimal types
  if (normalizedType.includes('NUMERIC') || normalizedType.includes('DECIMAL') || 
      normalizedType.includes('REAL') || normalizedType.includes('DOUBLE') || 
      normalizedType.includes('FLOAT')) {
    return 'number';
  }
  
  // Boolean type
  if (normalizedType.includes('BOOL')) {
    return 'boolean';
  }
  
  // Date/time types
  if (normalizedType.includes('TIMESTAMP') || normalizedType.includes('DATE') || 
      normalizedType.includes('TIME')) {
    return 'Date';
  }
  
  // JSON types
  if (normalizedType.includes('JSON')) {
    return 'Object';
  }
  
  // Array types
  if (normalizedType.includes('ARRAY') || normalizedType.includes('[]')) {
    return 'Array';
  }
  
  // Text/string types (VARCHAR, TEXT, CHAR, etc.)
  return 'string';
}

/**
 * Serialize value for database storage
 * Converts JavaScript values to PostgreSQL-compatible format
 * 
 * @param {*} value - Value to serialize
 * @param {string|null} fieldType - Expected field type from field metadata
 * @returns {*} Serialized value ready for database
 */
function serializeValue(value, fieldType = null) {
  // Handle null and undefined consistently
  if (value === undefined) {
    return null;
  }
  
  if (value === null) {
    return null;
  }
  
  // Handle Date objects - convert to ISO string
  if (value instanceof Date) {
    // Check if date is valid
    if (isNaN(value.getTime())) {
      throw new Error('Invalid Date object');
    }
    return value.toISOString();
  }
  
  // Handle string dates (convert to ISO format if needed)
  if (fieldType === 'Date' && typeof value === 'string') {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date string');
      }
      return date.toISOString();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Cannot convert "${value}" to Date: ${error.message}`);
    }
  }
  
  // Handle JSONB serialization for objects and arrays
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Plain object - serialize to JSON
    try {
      return JSON.stringify(value);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Cannot serialize object to JSON: ${error.message}`);
    }
  }
  
  if (Array.isArray(value)) {
    // Array - serialize to JSON
    try {
      return JSON.stringify(value);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Cannot serialize array to JSON: ${error.message}`);
    }
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw new Error('Cannot serialize NaN value');
    }
    if (!isFinite(value)) {
      throw new Error('Cannot serialize Infinity value');
    }
    return value;
  }
  
  // Handle strings
  if (typeof value === 'string') {
    // If field type is number and string is numeric, convert it
    if (fieldType === 'number' && !isNaN(Number(value)) && value.trim() !== '') {
      return parseInt(value, 10);
    }
    return value;
  }
  
  // For any other type, convert to string
  return String(value);
}

/**
 * Deserialize value from database result
 * Converts PostgreSQL values to appropriate JavaScript types
 * 
 * @param {*} value - Value from database
 * @param {string|null} fieldType - Expected field type from field metadata
 * @param {string} fieldName - Field name for error messages
 * @returns {*} Deserialized JavaScript value
 */
function deserializeValue(value, fieldType = null, fieldName = 'field') {
  // Handle null consistently
  if (value === null || value === undefined) {
    return null;
  }
  
  // If no field type hint, return as-is
  if (!fieldType) {
    return value;
  }
  
  try {
    switch (fieldType) {
      case 'Date':
        // PostgreSQL returns timestamps as Date objects or strings
        if (value instanceof Date) {
          return value;
        }
        if (typeof value === 'string') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date string from database');
          }
          return date;
        }
        return value;
      
      case 'Object':
        // Handle JSONB deserialization
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            throw new Error(`Cannot parse JSON for field "${fieldName}": ${error.message}`);
          }
        }
        // PostgreSQL might return JSONB as object already
        if (typeof value === 'object') {
          return value;
        }
        return value;
      
      case 'Array':
        // Handle JSONB array deserialization
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              throw new Error('Parsed value is not an array');
            }
            return parsed;
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            throw new Error(`Cannot parse JSON array for field "${fieldName}": ${error.message}`);
          }
        }
        // PostgreSQL might return JSONB as array already
        if (Array.isArray(value)) {
          return value;
        }
        return value;
      
      case 'boolean':
        // PostgreSQL returns booleans as true/false
        if (typeof value === 'boolean') {
          return value;
        }
        // Handle string representations
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true' || lower === 't' || lower === '1') {
            return true;
          }
          if (lower === 'false' || lower === 'f' || lower === '0') {
            return false;
          }
        }
        // Handle numeric representations
        if (typeof value === 'number') {
          return value !== 0;
        }
        return Boolean(value);
      
      case 'number':
        // PostgreSQL returns numbers as numbers
        if (typeof value === 'number') {
          return value;
        }
        // Handle string representations
        if (typeof value === 'string') {
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`Cannot convert "${value}" to number for field "${fieldName}"`);
          }
          return num;
        }
        return value;
      
      case 'string':
        // Convert to string if not already
        if (typeof value === 'string') {
          return value;
        }
        return String(value);
      
      default:
        // Return as-is for unknown types
        return value;
    }
  } catch (error) {
    // Log warning but don't fail - return original value
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn(`Type conversion warning for field "${fieldName}":`, err.message);
    return value;
  }
}

/**
 * Deserialize a complete database row
 * Applies type conversion to all fields based on field metadata
 * 
 * @param {Object} row - Database result row
 * @param {Array<Object>} fields - Field metadata array
 * @returns {Object} Row with deserialized values
 */
function deserializeRow(row, fields) {
  if (!row || typeof row !== 'object') {
    return row;
  }
  
  const deserialized = {};
  
  // Create maps for field lookup by both name and dbField
  const fieldMapByName = new Map();
  const fieldMapByDbField = new Map();
  fields.forEach(field => {
    fieldMapByName.set(field.name, field);
    if (field.dbField) {
      fieldMapByDbField.set(field.dbField, field);
    }
  });
  
  // Deserialize each field in the row
  for (const [key, value] of Object.entries(row)) {
    // Try to find field by name first, then by dbField
    let field = fieldMapByName.get(key);
    
    if (!field) {
      field = fieldMapByDbField.get(key);
    }
    
    if (field) {
      // Use the field's name property as the key in the deserialized object
      // This ensures tenant_id is properly mapped from the database column
      const propertyName = field.name;
      const deserializedValue = deserializeValue(value, field.type, propertyName);
      deserialized[propertyName] = deserializedValue;
    } else {
      // Field not in metadata - return as-is (might be from JOIN)
      deserialized[key] = value;
    }
  }
  
  return deserialized;
}

/**
 * Validate that a value matches the expected type
 * 
 * @param {*} value - Value to validate
 * @param {string} fieldType - Expected field type
 * @param {string} fieldName - Field name for error messages
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails and strict mode is enabled
 */
function validateType(value, fieldType, fieldName = 'field') {
  // Null/undefined are always valid (nullable check is separate)
  if (value === null || value === undefined) {
    return true;
  }
  
  const actualType = typeof value;
  
  switch (fieldType) {
    case 'string':
      if (actualType !== 'string') {
        throw new Error(`Field "${fieldName}" must be a string, got ${actualType}`);
      }
      return true;
    
    case 'number':
      if (actualType !== 'number') {
        throw new Error(`Field "${fieldName}" must be a number, got ${actualType}`);
      }
      if (isNaN(value)) {
        throw new Error(`Field "${fieldName}" cannot be NaN`);
      }
      if (!isFinite(value)) {
        throw new Error(`Field "${fieldName}" cannot be Infinity`);
      }
      return true;
    
    case 'boolean':
      if (actualType !== 'boolean') {
        throw new Error(`Field "${fieldName}" must be a boolean, got ${actualType}`);
      }
      return true;
    
    case 'Date':
      if (!(value instanceof Date) && actualType !== 'string') {
        throw new Error(`Field "${fieldName}" must be a Date or date string, got ${actualType}`);
      }
      if (value instanceof Date && isNaN(value.getTime())) {
        throw new Error(`Field "${fieldName}" is an invalid Date`);
      }
      if (actualType === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error(`Field "${fieldName}" contains an invalid date string`);
        }
      }
      return true;
    
    case 'Object':
      if (actualType !== 'object' || Array.isArray(value) || value instanceof Date) {
        throw new Error(`Field "${fieldName}" must be an object, got ${actualType}`);
      }
      return true;
    
    case 'Array':
      if (!Array.isArray(value)) {
        throw new Error(`Field "${fieldName}" must be an array, got ${actualType}`);
      }
      return true;
    
    default:
      // Unknown type - allow anything
      return true;
  }
}

module.exports = {
  mapJavaScriptToPostgreSQLType,
  mapPostgreSQLToJavaScriptType,
  serializeValue,
  deserializeValue,
  deserializeRow,
  validateType
};
