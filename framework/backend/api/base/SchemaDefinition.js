/**
 * Schema Definition System
 * 
 * Define entity schemas once in the backend and expose them to the frontend via API.
 * This eliminates duplicate schema definitions and ensures consistency.
 * 
 * Usage:
 * 1. Define schema in your model using defineSchema()
 * 2. Expose via API endpoint /api/schema/:entity
 * 3. Frontend fetches and uses the schema dynamically
 */

/**
 * Column  types supported by the schema system
 */
const ColumnTypes = {
  
}
/**
 * Field types supported by the schema system
 */
const FieldTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  EMAIL: 'email',
  PHONE: 'phone',
  COUNTRY: 'country',
  URL: 'url',
  OBJECT: 'object',
  ARRAY: 'array',
  JSON: 'json',
  SELECT: 'select',
};

/**
 * Define a field in the schema
 * 
 * @param {Object} definition - Field definition
 * @param {string} [definition.name] - Field name (required when used in formTabs structure)
 * @param {string} definition.type - Field type (string, number, boolean, date, etc.)
 * @param {*} definition.default - Default value
 * @param {boolean} [definition.required=false] - Whether field is required
 * @param {boolean} [definition.readOnly=false] - Whether field is read-only
 * @param {string} [definition.label] - Human-readable label
 * @param {string} [definition.description] - Field description
 * @param {string} [definition.placeholder] - Placeholder text
 * @param {Array<string>} [definition.filertable] - Filterable
 * @param {string} [definition.dbField] - Database column name (if different)
 * @param {Array<string>} [definition.enumValues] - Enum values for select fields
 * @param {number} [definition.minLength] - Minimum length for strings
 * @param {number} [definition.maxLength] - Maximum length for strings
 * @param {number} [definition.min] - Minimum value for numbers
 * @param {number} [definition.max] - Maximum value for numbers
 * @param {string} [definition.pattern] - Regex pattern for validation
 * @param {Array<string>} [definition.showOn] - Where to show field (e.g., ['form', 'list'])
 * @param {Object} [definition.formGrouping] - Form grouping configuration
 * @param {string} [definition.formGrouping.tabName] - Tab name for multi-tab forms (e.g., 'Basic', 'Advanced')
 * @param {string} [definition.formGrouping.sectionName] - Section name within tab (e.g., 'Basic Information')
 * @param {number} [definition.formGrouping.tabOrder] - Order of tab (lower numbers appear first)
 * @param {number} [definition.formGrouping.sectionOrder] - Order of section within tab (lower numbers appear first)
 * @param {number} [definition.formGrouping.fieldOrder] - Order of field within section (lower numbers appear first)
 * @param {boolean} [definition.validate] - Custom validation function
 * @param {Array<string>} [definition.validationFields] - Custom validation fields
 * @param {Function} [definition.toApi] - Transform value when sending to API
 * @param {Function} [definition.fromApi] - Transform value when receiving from API
 * @param {number} [definition.order] - Order within section (for formTabs structure)
 * @param {string} [definition.minWidth] - CSS min-width for field container
 * @param {string} [definition.maxWidth] - CSS max-width for field container
 * @returns {Object} Field definition
 */
function field(definition) {
  return {
    name: definition.name || null,
    type: definition.type,
    default: definition.default,
    required: definition.required || false,
    readOnly: definition.readOnly || false,
    label: definition.label || '',
    description: definition.description || '',
    placeholder: definition.placeholder || '',
    dbField: definition.dbField || null,
    enumValues: definition.enumValues || null,
    minLength: definition.minLength !== undefined ? definition.minLength : null,
    maxLength: definition.maxLength !== undefined ? definition.maxLength : null,
    min: definition.min !== undefined ? definition.min : null,
    max: definition.max !== undefined ? definition.max : null,
    pattern: definition.pattern || null,
    showOn: definition.showOn || null,
    formGrouping: definition.formGrouping || null,
    validate: definition.validate || null,
    validationFields: definition.validationFields || null,
    toApi: definition.toApi || null,
    fromApi: definition.fromApi || null,
    order: definition.order !== undefined ? definition.order : null,
    minWidth: definition.minWidth || null,
    maxWidth: definition.maxWidth || null,
  };
}

/**
 * Relationship types
 */
const RelationshipTypes = {
  BELONGS_TO: 'belongsTo',     // Many-to-one (e.g., Meter belongs to Location)
  HAS_MANY: 'hasMany',         // One-to-many (e.g., Location has many Meters)
  HAS_ONE: 'hasOne',           // One-to-one
  MANY_TO_MANY: 'manyToMany',  // Many-to-many (through junction table)
};

/**
 * Define a relationship
 * 
 * @param {Object} config - Relationship configuration
 * @param {string} config.type - Relationship type (belongsTo, hasMany, hasOne, manyToMany)
 * @param {string} config.model - Related model name
 * @param {string} config.foreignKey - Foreign key field name
 * @param {string} [config.targetKey] - Target key field name (default: 'id')
 * @param {string} [config.through] - Junction table name (for manyToMany)
 * @param {boolean} [config.autoLoad] - Auto-load related data (default: false)
 * @param {Array<string>} [config.select] - Fields to select from related model
 * @param {string} [config.as] - Alias for the relationship
 * @returns {Object} Relationship definition
 */
function relationship(config) {
  return {
    type: config.type,
    model: config.model,
    foreignKey: config.foreignKey,
    targetKey: config.targetKey || 'id',
    through: config.through || null,
    autoLoad: config.autoLoad || false,
    select: config.select || null,
    as: config.as || null, // Alias for the relationship
  };
}

/**
 * Create a field reference for use in formTabs structure
 * 
 * @param {Object} config - Field reference configuration
 * @param {string} config.name - Field name (must match a field in formFields)
 * @param {number} [config.order] - Order of field within section (lower numbers appear first)
 * @returns {Object} Field reference
 */
function fieldRef(config) {
  return {
    name: config.name,
    order: config.order !== undefined ? config.order : null,
  };
}

/**
 * Create a section definition for use in formTabs structure
 * 
 * @param {Object} config - Section configuration
 * @param {string} config.name - Section name (e.g., 'Basic Information')
 * @param {number} [config.order] - Order of section within tab (lower numbers appear first)
 * @param {Array<Object>} config.fields - Array of field definitions (with embedded name and order) or field references
 * @param {string} [config.minWidth] - CSS min-width for section container
 * @param {string} [config.maxWidth] - CSS max-width for section container
 * @param {number} [config.flex] - CSS flex property for section container (defaults to 1 for auto-grow)
 * @param {number} [config.flexGrow] - CSS flex-grow property for section container (defaults to 1 for auto-grow)
 * @param {number} [config.flexShrink] - CSS flex-shrink property for section container (defaults to 1 for auto-shrink)
 * @returns {Object} Section definition
 */
function section(config) {
  return {
    name: config.name,
    order: config.order !== undefined ? config.order : null,
    fields: config.fields || [],
    minWidth: config.minWidth || null,
    maxWidth: config.maxWidth || null,
    flex: config.flex !== undefined ? config.flex : 1,
    flexGrow: config.flexGrow !== undefined ? config.flexGrow : 1,
    flexShrink: config.flexShrink !== undefined ? config.flexShrink : 1,
  };
}

/**
 * Create a tab definition for use in formTabs structure
 * 
 * @param {Object} config - Tab configuration
 * @param {string} config.name - Tab name (e.g., 'Contact', 'Address')
 * @param {number} [config.order] - Order of tab (lower numbers appear first)
 * @param {Array<Object>} config.sections - Array of section definitions created with section()
 * @param {string} [config.sectionOrientation] - Section layout orientation ('horizontal' or 'vertical')
 * @param {Array<string>} [config.visibleFor] - Meter types for which this tab is visible (e.g., ['physical', 'virtual'])
 * @returns {Object} Tab definition
 */
function tab(config) {
  return {
    name: config.name,
    order: config.order !== undefined ? config.order : null,
    sections: config.sections || [],
    sectionOrientation: config.sectionOrientation || null,
    visibleFor: config.visibleFor || null,
  };
}

/**
 * Define an entity schema
 * 
 * @param {Object} definition - Schema definition
 * @param {string} definition.entityName - Entity name (e.g., 'Meter', 'Location')
 * @param {string} definition.tableName - Database table name
 * @param {string} [definition.description] - Entity description
 * @param {Object} definition.customListColumns - Custom columns that appear in lists
 * @param {Object} [definition.formFields] - Fields that appear in forms (user-editable) - OPTIONAL if formTabs is provided
 * @param {Array<Object>} [definition.formTabs] - Hierarchical tab/section/field organization with embedded field definitions
 * @param {string} [definition.formMaxWidth] - CSS max-width for the form element (e.g., '600px')
 * @param {Object} [definition.entityFields] - Additional fields in entity (read-only, computed)
 * @param {Object} [definition.relationships] - Entity relationships
 * @param {Object} [definition.validation] - Entity-level validation rules
 * @returns {Object} Schema definition with utilities
 */
function defineSchema(definition) {
  // Extract formFields from formTabs if formTabs is provided
  let formFields = definition.formFields || {};
  
  if (definition.formTabs && Array.isArray(definition.formTabs)) {
    const extractedFields = {};
    
    // Iterate through tabs
    definition.formTabs.forEach((tab) => {
      if (tab.sections && Array.isArray(tab.sections)) {
        // Iterate through sections
        tab.sections.forEach((section) => {
          if (section.fields && Array.isArray(section.fields)) {
            // Iterate through fields
            section.fields.forEach((fieldDef) => {
              // Check if this is a field definition (has 'type') or a field reference (has 'name' only)
              if (fieldDef.type) {
                // This is a full field definition - extract it
                const fieldName = fieldDef.name;
                if (fieldName) {
                  extractedFields[fieldName] = fieldDef;
                }
              }
            });
          }
        });
      }
    });
    
    // Merge extracted fields with any explicitly defined formFields
    formFields = { ...extractedFields, ...formFields };
  }

  const schema = {
    entityName: definition.entityName,
    tableName: definition.tableName,
    description: definition.description || '',
    formFields: formFields,
    formTabs: definition.formTabs || null,
    formMaxWidth: definition.formMaxWidth || null,
    entityFields: definition.entityFields || {},
    relationships: definition.relationships || {},
    validation: definition.validation || {},
    version: '1.2.0', // Updated to include formTabs support
    generatedAt: new Date().toISOString(),
  };

  /**
   * Get schema as JSON for API response
   */
  function toJSON() {
    // Remove functions before serializing, but preserve all other data including formGrouping
    const serializable = JSON.parse(JSON.stringify(schema, (key, value) => {
      // Skip functions and null values that represent "no value"
      if (typeof value === 'function') {
        return undefined;
      }
      // Preserve everything else, including objects like formGrouping
      return value;
    }));
    
    return serializable;
  }

  /**
   * Get all field names (form + entity)
   */
  function getAllFieldNames() {
    return [
      ...Object.keys(schema.formFields),
      ...Object.keys(schema.entityFields),
    ];
  }

  /**
   * Get form field names only
   */
  function getFormFieldNames() {
    return Object.keys(schema.formFields);
  }

  /**
   * Get entity field names only
   */
  function getEntityFieldNames() {
    return Object.keys(schema.entityFields);
  }

  /**
   * Check if a field is a form field
   */
  function isFormField(fieldName) {
    return fieldName in schema.formFields;
  }

  /**
   * Check if a field is an entity field
   */
  function isEntityField(fieldName) {
    return fieldName in schema.entityFields;
  }

  /**
   * Get field definition
   */
  function getField(fieldName) {
    return schema.formFields[fieldName] || schema.entityFields[fieldName] || null;
  }

  /**
   * Validate data against schema
   */
  function validate(data) {
    const errors = {};

    // Validate form fields
    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      const value = data[fieldName];

      // Required check
      if (fieldDef.required && (value === undefined || value === null || value === '')) {
        errors[fieldName] = `${fieldDef.label || fieldName} is required`;
        return;
      }

      // Skip validation if value is empty and not required
      if (value === undefined || value === null || value === '') {
        return;
      }

      // Type validation
      if (fieldDef.type === 'number' && typeof value !== 'number') {
        errors[fieldName] = `${fieldDef.label || fieldName} must be a number`;
      }

      if (fieldDef.type === 'boolean' && typeof value !== 'boolean') {
        errors[fieldName] = `${fieldDef.label || fieldName} must be a boolean`;
      }

      // String validations
      if ((fieldDef.type === 'string' || fieldDef.type === 'email') && typeof value === 'string') {
        if (fieldDef.minLength && value.length < fieldDef.minLength) {
          errors[fieldName] = `${fieldDef.label || fieldName} must be at least ${fieldDef.minLength} characters`;
        }
        if (fieldDef.maxLength && value.length > fieldDef.maxLength) {
          errors[fieldName] = `${fieldDef.label || fieldName} must be at most ${fieldDef.maxLength} characters`;
        }
        if (fieldDef.pattern && !new RegExp(fieldDef.pattern).test(value)) {
          errors[fieldName] = `${fieldDef.label || fieldName} format is invalid`;
        }
      }

      // Number validations
      if (fieldDef.type === 'number' && typeof value === 'number') {
        if (fieldDef.min !== null && value < fieldDef.min) {
          errors[fieldName] = `${fieldDef.label || fieldName} must be at least ${fieldDef.min}`;
        }
        if (fieldDef.max !== null && value > fieldDef.max) {
          errors[fieldName] = `${fieldDef.label || fieldName} must be at most ${fieldDef.max}`;
        }
      }

      // Enum validation
      if (fieldDef.enumValues && !fieldDef.enumValues.includes(value)) {
        errors[fieldName] = `${fieldDef.label || fieldName} must be one of: ${fieldDef.enumValues.join(', ')}`;
      }

      // Custom validation
      if (fieldDef.validate && typeof fieldDef.validate === 'function') {
        const customError = fieldDef.validate(value, data);
        if (customError) {
          errors[fieldName] = customError;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Transform form data to database format
   */
  function toDatabase(formData) {
    const dbData = {};

    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      const value = formData[fieldName];
      const dbField = fieldDef.dbField || fieldName;

      if (value !== undefined) {
        dbData[dbField] = fieldDef.toApi ? fieldDef.toApi(value) : value;
      }
    });

    return dbData;
  }

  /**
   * Transform database data to form format
   */
  function fromDatabase(dbData) {
    const formData = {};

    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      const dbField = fieldDef.dbField || fieldName;
      const value = dbData[dbField];

      if (value !== undefined) {
        formData[fieldName] = fieldDef.fromApi ? fieldDef.fromApi(value) : value;
      } else {
        formData[fieldName] = fieldDef.default;
      }
    });

    return formData;
  }

  /**
   * Initialize model instance from data using schema
   * Auto-populates all fields defined in schema
   */
  function initializeFromData(instance, data) {
    console.log('\n' + '█'.repeat(120));
    console.log('█ [SCHEMA] initializeFromData - START');
    console.log('█'.repeat(120));
    console.log('Instance class:', instance.constructor.name);
    console.log('Data keys:', Object.keys(data));
    console.log('Data:', JSON.stringify(data, null, 2));
    
    console.log('\nForm fields to initialize:');
    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      console.log(`  - ${fieldName} (dbField: ${fieldDef.dbField})`);
    });
    
    console.log('\nEntity fields to initialize:');
    Object.entries(schema.entityFields).forEach(([fieldName, fieldDef]) => {
      console.log(`  - ${fieldName} (dbField: ${fieldDef.dbField})`);
    });
    
    // Initialize form fields
    console.log('\n--- Initializing FORM FIELDS ---');
    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      // CRITICAL: Skip fields with dbField: null (custom-rendered fields like "elements")
      if (fieldDef.dbField === null) {
        console.log(`\nForm field: ${fieldName} (dbField: null) - SKIPPED (custom field)`);
        return;
      }
      
      const dbField = fieldDef.dbField || fieldName;
      console.log(`\nForm field: ${fieldName} (dbField: ${dbField})`);
      console.log(`  data[dbField] = data["${dbField}"] =`, data[dbField]);
      console.log(`  data[fieldName] = data["${fieldName}"] =`, data[fieldName]);
      console.log(`  fieldDef.default =`, fieldDef.default);
      
      // Use data value if provided, otherwise use default from field definition
      if (data[dbField] !== undefined) {
        instance[fieldName] = data[dbField];
        console.log(`  ✓ Set instance.${fieldName} = ${data[dbField]} (from dbField)`);
      } else if (data[fieldName] !== undefined) {
        instance[fieldName] = data[fieldName];
        console.log(`  ✓ Set instance.${fieldName} = ${data[fieldName]} (from fieldName)`);
      } else if (fieldDef.default !== undefined) {
        instance[fieldName] = fieldDef.default;
        console.log(`  ✓ Set instance.${fieldName} = ${fieldDef.default} (from default)`);
      } else {
        console.log(`  - No value set for ${fieldName}`);
      }
    });

    // Initialize entity fields
    console.log('\n--- Initializing ENTITY FIELDS ---');
    Object.entries(schema.entityFields).forEach(([fieldName, fieldDef]) => {
      // CRITICAL: Skip fields with dbField: null (custom-rendered fields like "elements")
      if (fieldDef.dbField === null) {
        console.log(`\nEntity field: ${fieldName} (dbField: null) - SKIPPED (custom field)`);
        return;
      }
      
      const dbField = fieldDef.dbField || fieldName;
      console.log(`\nEntity field: ${fieldName} (dbField: ${dbField})`);
      console.log(`  data[dbField] = data["${dbField}"] =`, data[dbField]);
      console.log(`  data[fieldName] = data["${fieldName}"] =`, data[fieldName]);
      console.log(`  fieldDef.default =`, fieldDef.default);
      
      // Use data value if provided, otherwise use default from field definition
      if (data[dbField] !== undefined) {
        instance[fieldName] = data[dbField];
        console.log(`  ✓ Set instance.${fieldName} = ${data[dbField]} (from dbField)`);
      } else if (data[fieldName] !== undefined) {
        instance[fieldName] = data[fieldName];
        console.log(`  ✓ Set instance.${fieldName} = ${data[fieldName]} (from fieldName)`);
      } else if (fieldDef.default !== undefined) {
        instance[fieldName] = fieldDef.default;
        console.log(`  ✓ Set instance.${fieldName} = ${fieldDef.default} (from default)`);
      } else {
        console.log(`  - No value set for ${fieldName}`);
      }
    });

    return instance;
  }

  /**
   * Get constructor code for model (for code generation)
   */
  function getConstructorCode(className, dataParamName = 'data') {
    const allFields = [
      ...Object.keys(schema.formFields),
      ...Object.keys(schema.entityFields),
    ];

    const assignments = allFields.map(fieldName => {
      return `    this.${fieldName} = ${dataParamName}.${fieldName};`;
    }).join('\n');

    return `  constructor(${dataParamName} = {}) {
    super(${dataParamName});
    
${assignments}
  }`;
  }

  return {
    // Expose schema data directly for easy access
    schema,
    formFields: schema.formFields,
    entityFields: schema.entityFields,
    relationships: schema.relationships,
    
    // Expose utility methods
    toJSON,
    getAllFieldNames,
    getFormFieldNames,
    getEntityFieldNames,
    isFormField,
    isEntityField,
    getField,
    validate,
    toDatabase,
    fromDatabase,
    initializeFromData,
    getConstructorCode,
  };
}

module.exports = {
  FieldTypes,
  RelationshipTypes,
  field,
  relationship,
  tab,
  section,
  fieldRef,
  defineSchema,
};
