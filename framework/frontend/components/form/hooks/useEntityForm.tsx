import { useState, useEffect, useCallback } from 'react';
import type { EntityFormConfig, EntityFormReturn } from '../types/form';
import { validateFormFields } from '../utils/fieldValidation';

/**
 * Reusable hook for entity form initialization and management
 * 
 * This hook handles the common pattern of initializing form data from an entity
 * for editing, or with default values for creating new entities. It automatically
 * updates the form when the entity prop changes.
 * 
 * @example
 * ```tsx
 * interface Contact {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * interface ContactFormData {
 *   name: string;
 *   email: string;
 * }
 * 
 * const ContactForm = ({ contact }: { contact?: Contact }) => {
 *   const { formData, setFormData, isEditMode, updateField } = useEntityForm({
 *     entity: contact,
 *     entityToFormData: (contact) => ({
 *       name: contact.name || '',
 *       email: contact.email || '',
 *     }),
 *     getDefaultFormData: () => ({
 *       name: '',
 *       email: '',
 *     }),
 *   });
 *   
 *   return (
 *     <form>
 *       <input
 *         value={formData.name}
 *         onChange={(e) => updateField('name', e.target.value)}
 *       />
 *       <input
 *         value={formData.email}
 *         onChange={(e) => updateField('email', e.target.value)}
 *       />
 *       <button type="submit">
 *         {isEditMode ? 'Update' : 'Create'}
 *       </button>
 *     </form>
 *   );
 * };
 * ```
 * 
 * @template TEntity - The entity type (e.g., Contact, User, Location)
 * @template TFormData - The form data structure type
 * 
 * @param config - Configuration object for the entity form
 * @returns Object containing form state and helper functions
 */
export function useEntityForm<TEntity, TFormData>({
  entity,
  entityToFormData,
  getDefaultFormData,
  onInitialize,
  entityName,
  validateFields = true,
}: EntityFormConfig<TEntity, TFormData>): EntityFormReturn<TFormData> {
  
  /**
   * Initialize form data based on entity presence
   */
  const initializeFormData = useCallback(
    (entityData: TEntity | undefined): TFormData => {
      const mode = entityData ? 'edit' : 'create';
      const formData = entityData 
        ? entityToFormData(entityData)
        : getDefaultFormData();
      
      // Validate form fields match entity structure (development only)
      if (validateFields && entityData) {
        validateFormFields(formData, entityData, entityName || 'Entity', {
          verbose: false,
        });
      }
      
      // Call optional initialization callback
      if (onInitialize) {
        onInitialize(formData, mode);
      }
      
      return formData;
    },
    [entityToFormData, getDefaultFormData, onInitialize, validateFields, entityName]
  );
  
  // Initialize form data state
  const [formData, setFormData] = useState<TFormData>(() => 
    initializeFormData(entity)
  );
  
  // Track which fields have been modified (dirty fields)
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  
  // Determine if we're in edit mode
  const isEditMode = entity !== undefined;
  
  /**
   * Update form data when entity prop changes
   * This ensures the form always reflects the current entity being edited
   */
  useEffect(() => {
    setFormData(initializeFormData(entity));
    setDirtyFields(new Set()); // Reset dirty fields when entity changes
  }, [entity]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: initializeFormData is intentionally excluded to prevent infinite loops
  // The function is stable and only depends on props that don't change
  
  /**
   * Helper function to update a single field in the form data
   * Supports nested field names using dot notation (e.g., 'address.street')
   * Also tracks which fields have been modified
   */
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => {
      // Handle nested field names (e.g., 'address.street')
      if (field.includes('.')) {
        const keys = field.split('.');
        const newData = { ...prev };
        let current: any = newData;
        
        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          current[key] = { ...(current[key] || {}) };
          current = current[key];
        }
        
        // Set the final value
        current[keys[keys.length - 1]] = value;
        return newData;
      }
      
      // Handle simple field names
      return { ...prev, [field]: value };
    });
    
    // Mark field as dirty
    setDirtyFields(prev => new Set([...prev, field]));
  }, []);
  
  /**
   * Reset form to initial state based on current entity
   */
  const resetForm = useCallback(() => {
    setFormData(initializeFormData(entity));
  }, [entity, initializeFormData]);
  
  return {
    formData,
    setFormData,
    isEditMode,
    updateField,
    resetForm,
    dirtyFields,
  };
}
