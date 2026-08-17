/**
 * Entity Schema Utilities
 * 
 * Unified schema definition system that generates both TypeScript types and form utilities
 * from a single schema definition. Eliminates duplication between form schemas and interfaces.
 */

import type { FieldDefinition, FormSchema } from './formSchema';
import { createFormSchema } from './formSchema';

/**
 * Enhanced field definition with additional metadata for entity schemas
 */
export interface EnhancedFieldDefinition<TValue = any> extends FieldDefinition<TValue> {
  /** Field description for help text */
  description?: string;
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Field grouping for UI organization */
  group?: string;
  /** Field ordering within group */
  order?: number;
  /** Enum values for enum types */
  enumValues?: readonly string[];
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Whether field is computed from other fields */
  computed?: boolean;
}

/**
 * Legacy field mapping for backward compatibility
 */
export interface LegacyFieldMapping {
  /** Which field this legacy field maps to */
  maps: string;
  /** Optional transformation function */
  transform?: (value: any) => any;
}

/**
 * Entity schema definition with form fields, entity fields, and legacy mappings
 */
export interface EntitySchemaDefinition<TForm extends Record<string, any>> {
  /** Fields that appear in forms (user-editable) */
  formFields: FormSchema<TForm>;
  /** Additional fields that exist in the entity but not in forms */
  entityFields?: Record<string, EnhancedFieldDefinition>;
  /** Legacy field mappings for backward compatibility */
  legacyFields?: Record<string, LegacyFieldMapping>;
  /** Entity name for documentation */
  entityName?: string;
  /** Entity description */
  description?: string;
}

/**
 * Validation result for schema definitions
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate schema definition for common errors
 */
export function validateSchema(definition: EntitySchemaDefinition<any>): ValidationResult {
  const errors: string[] = [];
  
  // Check for duplicate field names across form and entity fields
  const formFieldNames = Object.keys(definition.formFields);
  const entityFieldNames = Object.keys(definition.entityFields || {});
  const duplicates = formFieldNames.filter(name => entityFieldNames.includes(name));
  
  if (duplicates.length > 0) {
    errors.push(`Duplicate field names between formFields and entityFields: ${duplicates.join(', ')}`);
  }
  
  // Check legacy field mappings reference valid fields
  Object.entries(definition.legacyFields || {}).forEach(([legacyName, mapping]) => {
    const targetExists = formFieldNames.includes(mapping.maps) || 
                        entityFieldNames.includes(mapping.maps);
    if (!targetExists) {
      errors.push(`Legacy field '${legacyName}' maps to non-existent field '${mapping.maps}'`);
    }
  });
  
  // Check required fields have defaults
  Object.entries(definition.formFields).forEach(([name, fieldDef]: [string, any]) => {
    if (fieldDef.required && fieldDef.default === undefined) {
      errors.push(`Required field '${name}' must have a default value`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Type inference for field types
 */
export type InferFieldType<TField> = 
  TField extends { type: 'string' } ? string :
  TField extends { type: 'number' } ? number :
  TField extends { type: 'boolean' } ? boolean :
  TField extends { type: 'date' } ? Date :
  TField extends { type: 'email' } ? string :
  TField extends { type: 'phone' } ? string :
  TField extends { type: 'url' } ? string :
  TField extends { enumValues: readonly (infer U)[] } ? U :
  any;

/**
 * Infer TypeScript type from form schema
 */
export type InferFormType<TSchema> = {
  [K in keyof TSchema]: InferFieldType<TSchema[K]>
};

/**
 * Infer TypeScript type from entity fields
 */
export type InferEntityFields<TFields> = TFields extends Record<string, any>
  ? { [K in keyof TFields]: InferFieldType<TFields[K]> }
  : {};

/**
 * Infer TypeScript type from legacy fields (all optional)
 */
export type InferLegacyFields<TFields> = TFields extends Record<string, any>
  ? { [K in keyof TFields]?: any }
  : {};

/**
 * Infer complete entity type from schema definition
 */
export type InferEntityType<T extends EntitySchemaDefinition<any>> = 
  InferFormType<T['formFields']> & 
  InferEntityFields<T['entityFields']> &
  InferLegacyFields<T['legacyFields']>;

/**
 * Define an entity schema with form fields, entity fields, and legacy mappings
 */
export function defineEntitySchema<TForm extends Record<string, any>>(
  definition: EntitySchemaDefinition<TForm>
) {
  // Validate schema
  const validation = validateSchema(definition);
  if (!validation.isValid) {
    console.warn('Entity schema validation warnings:', validation.errors);
  }
  
  // Generate form utilities from form fields
  const formSchema = createFormSchema(definition.formFields);
  
  // Type helpers for inference
  type EntityType = InferEntityType<typeof definition>;
  
  return {
    // Form utilities (existing functionality)
    form: formSchema,
    
    // Type helpers for TypeScript inference
    _formType: {} as TForm,
    _entityType: {} as EntityType,
    
    // Schema metadata
    definition,
    
    // Utility functions
    isFormField: (key: string): boolean => key in definition.formFields,
    isEntityField: (key: string): boolean => key in (definition.entityFields || {}),
    isLegacyField: (key: string): boolean => key in (definition.legacyFields || {}),
    
    // Get all field names
    getFormFieldNames: (): string[] => Object.keys(definition.formFields),
    getEntityFieldNames: (): string[] => Object.keys(definition.entityFields || {}),
    getLegacyFieldNames: (): string[] => Object.keys(definition.legacyFields || {}),
    getAllFieldNames: (): string[] => [
      ...Object.keys(definition.formFields),
      ...Object.keys(definition.entityFields || {}),
      ...Object.keys(definition.legacyFields || {}),
    ],
  };
}
