/**
 * Field Mapping Utilities
 * 
 * Utilities for transforming form data to API format and vice versa.
 * Handles field name transformations and value conversions automatically.
 */

/**
 * Field mapping configuration
 */
export interface FieldMapping {
  /** Source field name (in form) */
  from: string;
  /** Target field name (in API) */
  to: string;
  /** Optional value transformer */
  transform?: (value: any) => any;
}

/**
 * Field mapping configuration object (simpler syntax)
 */
export type FieldMappingConfig = Record<string, string | FieldMapping>;

/**
 * Transform form data to API format using field mappings
 * 
 * @example
 * ```typescript
 * const apiData = transformFormToApi(formData, {
 *   zip: 'zip_code',  // Simple rename
 *   active: {         // With transformation
 *     to: 'status',
 *     transform: (active) => active ? 'active' : 'inactive'
 *   }
 * });
 * ```
 */
export function transformFormToApi<TForm = any, TApi = any>(
  formData: TForm,
  mappings: FieldMappingConfig = {},
  options: {
    /** Include all form fields not in mappings (default: true) */
    includeUnmapped?: boolean;
    /** Additional fields to add to output */
    additionalFields?: Record<string, any>;
  } = {}
): TApi {
  const { includeUnmapped = true, additionalFields = {} } = options;
  const result: any = { ...additionalFields };
  const mappedFields = new Set<string>();

  // Process mappings
  Object.entries(mappings).forEach(([fromField, mapping]) => {
    const value = (formData as any)[fromField];
    
    if (typeof mapping === 'string') {
      // Simple field rename
      result[mapping] = value;
      mappedFields.add(fromField);
    } else {
      // Field with transformation
      const { to, transform } = mapping;
      result[to] = transform ? transform(value) : value;
      mappedFields.add(fromField);
    }
  });

  // Include unmapped fields if enabled
  if (includeUnmapped) {
    Object.entries(formData as any).forEach(([key, value]) => {
      if (!mappedFields.has(key)) {
        result[key] = value;
      }
    });
  }

  return result as TApi;
}

/**
 * Transform API data to form format using field mappings
 * 
 * @example
 * ```typescript
 * const formData = transformApiToForm(apiData, {
 *   zip_code: 'zip',
 *   status: {
 *     to: 'active',
 *     transform: (status) => status === 'active'
 *   }
 * });
 * ```
 */
export function transformApiToForm<TApi = any, TForm = any>(
  apiData: TApi,
  mappings: FieldMappingConfig = {},
  options: {
    /** Include all API fields not in mappings (default: true) */
    includeUnmapped?: boolean;
    /** Default values for missing fields */
    defaults?: Partial<TForm>;
  } = {}
): TForm {
  const { includeUnmapped = true, defaults = {} } = options;
  const result: any = { ...defaults };
  const mappedFields = new Set<string>();

  // Process mappings (reverse direction)
  Object.entries(mappings).forEach(([formField, mapping]) => {
    if (typeof mapping === 'string') {
      // Simple field rename (reverse)
      const apiField = mapping;
      result[formField] = (apiData as any)[apiField];
      mappedFields.add(apiField);
    } else {
      // Field with transformation (reverse)
      const { to: apiField, transform } = mapping;
      const value = (apiData as any)[apiField];
      result[formField] = transform ? transform(value) : value;
      mappedFields.add(apiField);
    }
  });

  // Include unmapped fields if enabled
  if (includeUnmapped) {
    Object.entries(apiData as any).forEach(([key, value]) => {
      if (!mappedFields.has(key) && !(key in result)) {
        result[key] = value;
      }
    });
  }

  return result as TForm;
}

/**
 * Create a bidirectional field mapper
 * 
 * @example
 * ```typescript
 * const mapper = createFieldMapper({
 *   zip: 'zip_code',
 *   active: {
 *     to: 'status',
 *     transform: (active) => active ? 'active' : 'inactive',
 *     reverse: (status) => status === 'active'
 *   }
 * });
 * 
 * const apiData = mapper.toApi(formData);
 * const formData = mapper.toForm(apiData);
 * ```
 */
export function createFieldMapper<TForm = any, TApi = any>(
  mappings: Record<string, string | (FieldMapping & { reverse?: (value: any) => any })>
) {
  return {
    toApi: (formData: TForm, options?: Parameters<typeof transformFormToApi>[2]) =>
      transformFormToApi<TForm, TApi>(formData, mappings, options),
    
    toForm: (apiData: TApi, options?: Parameters<typeof transformApiToForm>[2]) => {
      // Create reverse mappings
      const reverseMappings: FieldMappingConfig = {};
      Object.entries(mappings).forEach(([formField, mapping]) => {
        if (typeof mapping === 'string') {
          reverseMappings[formField] = mapping;
        } else {
          reverseMappings[formField] = {
            from: formField,
            to: mapping.to,
            transform: mapping.reverse || mapping.transform,
          };
        }
      });
      return transformApiToForm<TApi, TForm>(apiData, reverseMappings, options);
    },
  };
}

/**
 * Common field transformations
 */
export const commonTransforms = {
  /** Convert boolean to active/inactive status */
  booleanToStatus: (value: boolean) => value ? 'active' : 'inactive',
  
  /** Convert active/inactive status to boolean */
  statusToBoolean: (value: string) => value === 'active',
  
  /** Convert snake_case to camelCase */
  snakeToCamel: (str: string) =>
    str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
  
  /** Convert camelCase to snake_case */
  camelToSnake: (str: string) =>
    str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
  
  /** Trim string values */
  trim: (value: string) => value?.trim(),
  
  /** Convert to lowercase */
  lowercase: (value: string) => value?.toLowerCase(),
  
  /** Convert to uppercase */
  uppercase: (value: string) => value?.toUpperCase(),
  
  /** Parse number from string */
  parseNumber: (value: string) => parseFloat(value),
  
  /** Convert to string */
  toString: (value: any) => String(value),
};
