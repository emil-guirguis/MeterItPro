/**
 * Schema Loader
 * 
 * Fetches entity schemas from the backend API and converts them
 * to frontend-compatible format.
 * 
 * This eliminates the need to duplicate schema definitions between
 * backend and frontend.
 */

import * as React from 'react';
import type { FieldDefinition } from './formSchema';

/**
 * Backend schema format (from API)
 */
export interface BackendFieldDefinition {
  type: string;
  default: any;
  required: boolean;
  readOnly: boolean;
  label: string;
  description: string;
  placeholder: string;
  dbField: string | null;
  enumValues: string[] | null;
  minLength: number | null;
  maxLength: number | null;
  min: number | null;
  max: number | null;
  pattern: string | null;
  showOn?: string[];
  validate?: boolean;
  validationFields?: string[];
  formGrouping?: {
    tabName: string;
    sectionName: string;
    tabOrder: number;
    sectionOrder: number;
    fieldOrder: number;
  };
}

export interface BackendSchema {
  entityName: string;
  tableName: string;
  description: string;
  formFields: Record<string, BackendFieldDefinition>;
  entityFields: Record<string, BackendFieldDefinition>;
  formTabs?: Array<{
    name: string;
    order?: number | null;
    sectionOrientation?: 'horizontal' | 'vertical' | null;
    sections: Array<{
      name: string;
      order?: number | null;
      fields: Array<{
        name: string;
        order?: number | null;
      }>;
      minWidth?: string | null;
      maxWidth?: string | null;
      flex?: number | null;
      flexGrow?: number | null;
      flexShrink?: number | null;
    }>;
  }>;
  relationships: Record<string, any>;
  validation: Record<string, any>;
  version: string;
  generatedAt: string;
}

/**
 * Schema cache entry with timestamp for TTL
 */
interface CacheEntry {
  schema: BackendSchema;
  timestamp: number;
}

/**
 * Schema cache to avoid repeated API calls
 */
const schemaCache = new Map<string, CacheEntry>();

/**
 * Cache TTL in milliseconds (default: 5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetch schema from backend API
 * 
 * @param entityName - Entity name (e.g., 'meter', 'location')
 * @param options - Fetch options
 * @returns Backend schema definition
 */
export async function fetchSchema(
  entityName: string,
  options: { cache?: boolean; baseUrl?: string; ttl?: number } = {}
): Promise<BackendSchema> {
  // Use environment variable for API base URL, fallback to relative path
  const defaultBaseUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL 
    ? (import.meta as any).env.VITE_API_BASE_URL 
    : 'http://localhost:3001/api';
  const { cache = true, baseUrl = defaultBaseUrl, ttl = CACHE_TTL } = options;

  // Check cache first
  if (cache && schemaCache.has(entityName)) {
    const entry = schemaCache.get(entityName)!;
    const age = Date.now() - entry.timestamp;
    
    // Return cached schema if still valid
    if (age < ttl) {
      console.log(`[SchemaLoader] ✅ Cache HIT: ${entityName} (age: ${age}ms, TTL: ${ttl}ms)`);
      return entry.schema;
    }
    
    // Cache expired, remove it
    console.log(`[SchemaLoader] ⏰ Cache EXPIRED: ${entityName} (age: ${age}ms, TTL: ${ttl}ms)`);
    schemaCache.delete(entityName);
  }

  try {
    // Get authentication token from localStorage or sessionStorage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    console.log('[SchemaLoader] Fetching schema for:', entityName);
    console.log('[SchemaLoader] Token available:', !!token);
    console.log('[SchemaLoader] Token value:', token ? `${token.substring(0, 20)}...` : 'null');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('[SchemaLoader] Request URL:', `${baseUrl}/schema/${entityName}`);
    console.log('[SchemaLoader] Request headers:', headers);
    
    const response = await fetch(`${baseUrl}/schema/${entityName}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch schema');
    }

    if (!result.data) {
      throw new Error('Schema data is missing from response');
    }

    const schema = result.data as BackendSchema;

    // Log formTabs to verify they're being sent
    if (schema.formTabs) {
      console.log(`[SchemaLoader] ✅ formTabs found in schema:`, schema.formTabs.length, 'tabs');
      schema.formTabs.forEach((tab, idx) => {
        console.log(`  Tab ${idx}: ${tab.name}, sections:`, tab.sections?.length || 0);
        tab.sections?.forEach((sec, sidx) => {
          console.log(`    Section ${sidx}: ${sec.name}, flex: ${sec.flex}, flexGrow: ${sec.flexGrow}, flexShrink: ${sec.flexShrink}`);
        });
      });
    } else {
      console.log(`[SchemaLoader] ⚠️ NO formTabs in schema`);
    }

    // Cache the schema with timestamp
    if (cache) {
      schemaCache.set(entityName, {
        schema,
        timestamp: Date.now(),
      });
      console.log(`✅ SCHEMA LOADED: ${entityName} (${Object.keys(schema.formFields).length} form fields)`);
      logSchemasInMemory();
    }

    return schema;
  } catch (error) {
    console.error(`Error fetching schema for ${entityName}:`, error);
    throw error;
  }
}

/**
 * Convert backend field definition to frontend format
 */
function convertFieldDefinition(backendField: BackendFieldDefinition & { validate?: boolean; validationFields?: string[]; formGrouping?: any }): FieldDefinition {
  return {
    type: backendField.type as any,
    default: backendField.default,
    required: backendField.required,
    label: backendField.label,
    apiField: backendField.dbField || undefined,
    dbField: backendField.dbField,
    // Add validation rules (check for null/undefined, not falsy, to allow 0)
    ...(backendField.minLength != null && { minLength: backendField.minLength }),
    ...(backendField.maxLength != null && { maxLength: backendField.maxLength }),
    ...(backendField.min != null && { min: backendField.min }),
    ...(backendField.max != null && { max: backendField.max }),
    ...(backendField.pattern && { pattern: backendField.pattern }),
    ...(backendField.enumValues && { enumValues: backendField.enumValues }),
    // Preserve validation field properties for dropdown rendering
    ...(backendField.validate != null && { validate: backendField.validate }),
    ...(backendField.validationFields && { validationFields: backendField.validationFields }),
    // Preserve showOn property for visibility control
    ...(backendField.showOn && { showOn: backendField.showOn }),
    // Preserve formGrouping for tab/section organization
    ...(backendField.formGrouping && { formGrouping: backendField.formGrouping }),
  };
}

/**
 * Converted schema format for frontend use
 */
export interface ConvertedSchema {
  formFields: Record<string, FieldDefinition>;
  entityFields: Record<string, FieldDefinition>;
  formTabs: Array<{
    name: string;
    order?: number | null;
    visibleFor?: ('physical' | 'virtual')[];
    sectionOrientation?: 'horizontal' | 'vertical' | null;
    sections: Array<{
      name: string;
      order?: number | null;
      visibleFor?: ('physical' | 'virtual')[];
      fields: Array<{
        name: string;
        order?: number | null;
        visibleFor?: ('physical' | 'virtual')[];
      }>;
      minWidth?: string | null;
      maxWidth?: string | null;
      flex?: number | null;
      flexGrow?: number | null;
      flexShrink?: number | null;
    }>;
  }> | null;
  entityName: string;
  description: string;
  relationships: Record<string, any>;
  /**
   * Primary key field name in backend schema (e.g., 'contact_id')
   * Helps frontend map IDs when API returns non-standard 'id' fields.
   */
  idFieldName?: string | null;
}

/**
 * Convert backend schema to frontend schema format
 */
export function convertSchema(backendSchema: BackendSchema): ConvertedSchema {
  const formFields: Record<string, FieldDefinition> = {};
  const entityFields: Record<string, FieldDefinition> = {};

  // Convert form fields
  Object.entries(backendSchema.formFields).forEach(([fieldName, fieldDef]) => {
    formFields[fieldName] = convertFieldDefinition(fieldDef);
  });

  // Some schemas define fields inside formTabs but not in formFields object.
  // Ensure we include any fields declared inside formTabs into formFields so
  // the frontend (filters, lists, forms) can access them uniformly.
  if (backendSchema.formTabs) {
    backendSchema.formTabs.forEach((tab) => {
      tab.sections?.forEach((section) => {
        section.fields?.forEach((field) => {
          if (field && field.name && !formFields[field.name]) {
            // field may be a lightweight object; convert and merge
            formFields[field.name] = convertFieldDefinition(field as any);
          }
        });
      });
    });
  }

  // Convert entity fields
  Object.entries(backendSchema.entityFields).forEach(([fieldName, fieldDef]) => {
    entityFields[fieldName] = convertFieldDefinition(fieldDef);
  });
  // Determine primary ID field name
  const tableIdField = `${backendSchema.tableName}_id`;
  let idFieldName: string | null = null;
  if (backendSchema.entityFields && backendSchema.entityFields[tableIdField]) {
    idFieldName = tableIdField;
  } else {
    // fallback: first entity field that ends with _id
    const candidate = Object.keys(backendSchema.entityFields || {}).find(k => k.endsWith('_id'));
    idFieldName = candidate || null;
  }

  return {
    formFields,
    entityFields,
    formTabs: backendSchema.formTabs || null,
    entityName: backendSchema.entityName,
    description: backendSchema.description,
    relationships: backendSchema.relationships,
    idFieldName,
  };
}

/**
 * Load and convert schema from backend
 * 
 * @param entityName - Entity name
 * @returns Converted schema ready for frontend use
 */
export async function loadSchema(entityName: string) {
  const backendSchema = await fetchSchema(entityName);
  return convertSchema(backendSchema);
}

/**
 * Clear schema cache
 */
export function clearSchemaCache(entityName?: string) {
  if (entityName) {
    schemaCache.delete(entityName);
  } else {
    schemaCache.clear();
  }
}

/**
 * Log all schemas currently in memory
 */
export function logSchemasInMemory() {
  if (schemaCache.size === 0) {
    console.log('📋 SCHEMAS IN MEMORY: NONE');
    return;
  }
  
  console.log(`📋 SCHEMAS IN MEMORY: ${schemaCache.size} schemas loaded`);
  schemaCache.forEach((entry, entityName) => {
    const age = Date.now() - entry.timestamp;
    const ageSeconds = Math.round(age / 1000);
    const formFieldCount = Object.keys(entry.schema.formFields).length;
    const entityFieldCount = Object.keys(entry.schema.entityFields).length;
    console.log(`  [${entityName}] ${formFieldCount} form fields, ${entityFieldCount} entity fields (cached ${ageSeconds}s ago)`);
  });
}

/**
 * Prefetch schemas for multiple entities
 * Useful for preloading schemas on app startup
 * 
 * @param entityNames - Array of entity names to prefetch
 * @param options - Fetch options
 * @returns Promise that resolves when all schemas are loaded
 */
export async function prefetchSchemas(
  entityNames: string[],
  options: { baseUrl?: string; ttl?: number } = {}
) {
  const promises = entityNames.map(name => 
    fetchSchema(name, { ...options, cache: true })
  );
  return Promise.all(promises);
}

/**
 * Get cache statistics
 * Useful for debugging and monitoring
 */
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(schemaCache.entries());
  
  return {
    size: schemaCache.size,
    entries: entries.map(([entityName, entry]) => ({
      entityName,
      age: now - entry.timestamp,
      expired: now - entry.timestamp >= CACHE_TTL,
    })),
  };
}

/**
 * Invalidate expired cache entries
 * Can be called periodically to clean up stale entries
 */
export function invalidateExpiredCache() {
  const now = Date.now();
  const toDelete: string[] = [];
  
  schemaCache.forEach((entry, entityName) => {
    if (now - entry.timestamp >= CACHE_TTL) {
      toDelete.push(entityName);
    }
  });
  
  toDelete.forEach(entityName => schemaCache.delete(entityName));
  
  return toDelete.length;
}

/**
 * Get list of available schemas from backend
 */
export async function getAvailableSchemas(baseUrl?: string): Promise<Array<{
  entityName: string;
  tableName: string;
  description: string;
  endpoint: string;
}>> {
  // Use environment variable for API base URL, fallback to relative path
  const defaultBaseUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL 
    ? (import.meta as any).env.VITE_API_BASE_URL 
    : 'http://localhost:3001/api';
  const apiBaseUrl = baseUrl || defaultBaseUrl;
  
  try {
    // Get authentication token from localStorage or sessionStorage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${apiBaseUrl}/schema`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schema list: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch schema list');
    }

    return result.data.schemas;
  } catch (error) {
    console.error('Error fetching schema list:', error);
    throw error;
  }
}

/**
 * React hook for loading schemas
 * 
 * @param entityName - Entity name
 * @param options - Options for schema loading
 * @returns Schema state
 */
export function useSchema(entityName: string, options?: { bypassCache?: boolean }) {
  const [schema, setSchema] = React.useState<ConvertedSchema | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const startTime = Date.now();
        
        // Check if schema is already in cache before setting loading state
        if (!options?.bypassCache && schemaCache.has(entityName)) {
          const entry = schemaCache.get(entityName)!;
          const age = Date.now() - entry.timestamp;
          
          if (age < CACHE_TTL) {
            console.log(`[useSchema] ✅ Cache HIT for ${entityName} (age: ${age}ms)`);
            const convertedSchema = convertSchema(entry.schema);
            if (mounted) {
              setSchema(convertedSchema);
              setError(null);
              setLoading(false);
            }
            return;
          }
        }
        
        console.log(`[useSchema] 🔄 Cache MISS for ${entityName}, fetching from API...`);
        setLoading(true);
        const loadedSchema = await loadSchema(entityName);
        const duration = Date.now() - startTime;
        console.log(`[useSchema] ✅ Loaded ${entityName} from API in ${duration}ms`);
        
        if (mounted) {
          setSchema(loadedSchema);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error(`[useSchema] ❌ Error loading ${entityName}:`, err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [entityName]);

  return { schema, loading, error };
}
