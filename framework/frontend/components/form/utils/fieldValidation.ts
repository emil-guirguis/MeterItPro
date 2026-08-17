/**
 * Field Validation Utilities
 * 
 * These utilities help validate that form fields match the backend entity structure
 * and provide helpful console warnings during development.
 */

// Check if we're in development mode
const isDevelopment = (() => {
  try {
    // @ts-ignore - process may not be defined in browser
    return process.env.NODE_ENV !== 'production';
  } catch {
    return true; // Default to development if process is not available
  }
})();

/**
 * Validates that form data fields exist in the entity data
 * Logs warnings to console for any mismatches to help with debugging
 * 
 * @param formData - The form data object with fields to validate
 * @param entityData - The entity data from the backend
 * @param entityName - Name of the entity (e.g., 'Contact', 'User') for logging
 * @param options - Optional configuration
 */
export function validateFormFields<TFormData, TEntity>(
  formData: TFormData,
  entityData: TEntity | undefined,
  entityName: string,
  options: {
    /** Fields that are expected to be in form but not in entity (e.g., computed fields) */
    ignoreFields?: string[];
    /** Enable detailed logging */
    verbose?: boolean;
  } = {}
): void {
  // Only run validation in development mode
  if (!isDevelopment) {
    return;
  }

  // Skip validation if no entity data (create mode)
  if (!entityData) {
    if (options.verbose) {
      console.log(`[Field Validation] Skipping validation for ${entityName} - no entity data (create mode)`);
    }
    return;
  }

  const { ignoreFields = [], verbose = false } = options;
  const formFields = Object.keys(formData as object);
  const entityFields = Object.keys(entityData as object);
  
  const missingInEntity: string[] = [];
  const missingInForm: string[] = [];
  
  // Check for form fields that don't exist in entity
  formFields.forEach(field => {
    if (!ignoreFields.includes(field) && !entityFields.includes(field)) {
      missingInEntity.push(field);
    }
  });
  
  // Check for entity fields that don't exist in form
  entityFields.forEach(field => {
    if (!ignoreFields.includes(field) && !formFields.includes(field)) {
      missingInForm.push(field);
    }
  });
  
  // Log warnings for mismatches
  if (missingInEntity.length > 0) {
    console.warn(
      `[Field Validation] ${entityName} form has fields that don't exist in backend entity:`,
      missingInEntity,
      '\nThese fields will not be populated when editing. Check your backend model or remove these fields from the form.'
    );
  }
  
  if (missingInForm.length > 0 && verbose) {
    console.info(
      `[Field Validation] ${entityName} entity has fields not in form:`,
      missingInForm,
      '\nThese fields are available but not being used in the form.'
    );
  }
  
  if (missingInEntity.length === 0 && missingInForm.length === 0) {
    if (verbose) {
      console.log(`[Field Validation] ✓ ${entityName} form fields match entity structure`);
    }
  }
}

/**
 * Validates that a specific field exists in the entity data
 * Logs a warning if the field is missing
 * 
 * @param fieldName - Name of the field to validate
 * @param entityData - The entity data from the backend
 * @param entityName - Name of the entity for logging
 * @returns true if field exists, false otherwise
 */
export function validateField<TEntity>(
  fieldName: string,
  entityData: TEntity | undefined,
  entityName: string
): boolean {
  if (!isDevelopment) {
    return true;
  }

  if (!entityData) {
    return true; // Skip validation in create mode
  }

  const exists = fieldName in (entityData as object);
  
  if (!exists) {
    console.warn(
      `[Field Validation] Field "${fieldName}" does not exist in ${entityName} entity.`,
      '\nAvailable fields:', Object.keys(entityData as object).join(', ')
    );
  }
  
  return exists;
}

/**
 * Logs the structure of an entity for debugging purposes
 * 
 * @param entityData - The entity data to inspect
 * @param entityName - Name of the entity for logging
 */
export function logEntityStructure<TEntity>(
  entityData: TEntity,
  entityName: string
): void {
  if (!isDevelopment) {
    return;
  }

  console.group(`[Entity Structure] ${entityName}`);
  console.log('Fields:', Object.keys(entityData as object));
  console.log('Data:', entityData);
  console.groupEnd();
}
