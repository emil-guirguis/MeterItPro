import React, { useState } from 'react';
// Sidebar intentionally removed from framework-level forms
import type { SidebarSectionProps } from '../sidebar/Sidebar';
import { useSchema, clearSchemaCache } from './utils/schemaLoader';
import type { BackendFieldDefinition } from './utils/schemaLoader';
import { createFormSchema } from './utils/formSchema';
import { useEntityFormWithStore } from './hooks/useEntityFormWithStore';
import { useFormTabs } from './hooks/useFormTabs';
import { FormTabs } from './FormTabs';
import { ValidationFieldSelect } from '../validationfieldselect/ValidationFieldSelect';
import { FormField } from '../formfield/FormField';
import './BaseForm.css';

export interface BaseFormProps {
  children?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  sidebarSections?: SidebarSectionProps[];
  sidebarChildren?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  // showSidebar?: boolean;
  // Dynamic schema form props
  schemaName?: string;
  entity?: any;
  store?: any;
  onLegacySubmit?: (data: any) => Promise<void>;
  renderCustomField?: (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => React.ReactNode | null;
  fieldSections?: Record<string, string[] | { fields: string[]; maxWidth?: string }>;
  loading?: boolean;
  excludeFields?: string[];
  fieldsToClean?: string[];
  validationDataProvider?: (entityName: string, fieldDef: any) => Promise<Array<{ id: any; label: string }>>;
  showTabs?: boolean;
  onTabChange?: (tabName: string) => void;
  // Form width constraints
  formMaxWidth?: string;
  formMinWidth?: string;
  /**
   * The type of meter being edited. Used to filter tabs based on meter type.
   * - 'physical': For physical meters (shows Elements tab)
   * - 'virtual': For virtual meters (shows Combined Meters tab)
   * - null/undefined: Shows all tabs (default behavior)
   * 
   * This prop is passed to the useFormTabs hook to conditionally render tabs
   * based on the tab's visibleFor property.
   */
  meterType?: 'physical' | 'virtual' | null;
}

/**
 * Base Form Component
 * 
 * Provides a consistent form layout with:
 * - Main content area for form fields
 * - Right sidebar for actions and metadata
 * - Collapsible action sections
 * - Responsive design
 * - Optional dynamic schema-based form rendering
 * 
 * @example
 * ```tsx
 * // Manual form with children
 * <BaseForm
 *   onSubmit={handleSubmit}
 *   className="contact-form"
 * >
 *   Form fields go here
 * </BaseForm>
 * 
 * // Dynamic schema form
 * <BaseForm
 *   schemaName="contact"
 *   entity={contact}
 *   store={contactsStore}
 *   onCancel={handleCancel}
 *   fieldSections={{
 *     'Basic Info': ['name', 'email'],
 *     'Address': ['street', 'city'],
 *   }}
 *   className="contact-form"
 * />
 * ```
 */
export const BaseForm: React.FC<BaseFormProps> = ({
  children,
  onSubmit,
  className = '',
  // sidebarSections and sidebarChildren remain available to callers but framework no longer renders a sidebar
  sidebarSections,
  sidebarChildren,
  onCancel,
  // Dynamic schema form props
  schemaName,
  entity,
  store,
  onLegacySubmit,
  renderCustomField,
  fieldSections,
  loading = false,
  excludeFields = [],
  fieldsToClean = ['id'],
  validationDataProvider,
  showTabs = true,
  onTabChange,
  // Form width constraints
  formMaxWidth,
  formMinWidth,
  // Meter type for tab filtering
  meterType,
}) => {
  const formClassName = className ? `base-form ${className}` : 'base-form';
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('');

  // Clear schema cache when form mounts to ensure fresh schema
  React.useEffect(() => {
    if (schemaName) {
      console.log('[BaseForm] Clearing schema cache for:', schemaName);
      clearSchemaCache(schemaName);
    }
  }, [schemaName]);

  // Dynamic schema form logic
  const isDynamicForm = !!schemaName;
  const { schema, loading: schemaLoading, error: schemaError } = useSchema(isDynamicForm ? schemaName! : '', { bypassCache: true });

  // Determine the active tab - use state if set, otherwise use first tab from schema
  const effectiveActiveTab = React.useMemo(() => {
    // If activeTab state is set, use it
    if (activeTab) return activeTab;
    
    // Otherwise, use first tab from schema
    if (schema?.formTabs && schema.formTabs.length > 0) {
      const sortedTabs = [...schema.formTabs].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      const firstTabName = sortedTabs[0].name;
      console.log('[BaseForm] Setting effectiveActiveTab to first tab:', firstTabName);
      return firstTabName;
    }
    
    console.log('[BaseForm] No tabs available');
    return '';
  }, [schema?.formTabs, activeTab]);

  // Use formTabs from schema if available, otherwise use provided fieldSections
  const { tabs: allTabs, fieldSections: formTabsFieldSections, tabList } = useFormTabs(
    schema?.formTabs,
    effectiveActiveTab,
    meterType
  );

  console.log('[BaseForm] useFormTabs result:', {
    inputFormTabs: schema?.formTabs,
    inputActiveTab: effectiveActiveTab,
    outputTabs: allTabs,
    outputTabList: tabList,
    outputFieldSections: formTabsFieldSections,
  });

  // Debug logging
  React.useEffect(() => {
    if (schema) {
      console.log('[BaseForm] Schema loaded:', {
        entityName: schema.entityName,
        hasFormTabs: !!schema.formTabs,
        formTabsLength: schema.formTabs?.length,
      });
    }
  }, [schema]);

  React.useEffect(() => {
    console.log('[BaseForm] Tab state:', {
      tabList,
      effectiveActiveTab,
      activeTab,
      allTabsKeys: Object.keys(allTabs),
      formTabsFieldSectionsKeys: Object.keys(formTabsFieldSections),
      formTabsFieldSections,
      allTabs,
      hasFormTabs: !!schema?.formTabs,
      formTabsLength: schema?.formTabs?.length,
    });
  }, [tabList, effectiveActiveTab, activeTab, allTabs, formTabsFieldSections]);

  // Debug: Log what sections will be rendered
  React.useEffect(() => {
    const sectionsToRender = fieldSections || formTabsFieldSections || {};
    console.log('[BaseForm] Sections to render:', {
      hasFieldSectionsProp: !!fieldSections,
      fieldSectionsProp: fieldSections,
      formTabsFieldSections,
      sectionsToRender,
      sectionCount: Object.keys(sectionsToRender).length,
      formFieldsCount: Object.keys(schema?.formFields || {}).length,
    });
  }, [fieldSections, formTabsFieldSections, schema?.formFields]);

  // Call onTabChange when effectiveActiveTab changes (including initial load)
  React.useEffect(() => {
    if (effectiveActiveTab && onTabChange) {
      console.log('[BaseForm] Calling onTabChange for effectiveActiveTab:', effectiveActiveTab);
      onTabChange(effectiveActiveTab);
    }
  }, [effectiveActiveTab, onTabChange]);

  // Normalize entity and store so framework hooks work with backend schemas that use non-standard id fields
  const normalizedEntity = React.useMemo(() => {
    if (!entity || !schema) return entity;
    const idField = (schema as any).idFieldName;
    if (idField && (entity as any)[idField] !== undefined && (entity as any).id === undefined) {
      return { ...entity, id: (entity as any)[idField] };
    }
    return entity;
  }, [entity, schema]);

  const normalizedStore = React.useMemo(() => {
    if (!store || !schema) return store;
    const idField = (schema as any).idFieldName;
    // If store already provides createItem/updateItem, prefer those; otherwise wrap existing methods
    const proxy: any = { ...store };

    // Wrap create to normalize id field on returned entity
    if (!proxy.createItem) {
      const createFn = proxy.createReport || proxy.create || proxy.createItem;
      if (createFn) {
        proxy.createItem = async (data: any) => {
          const saved = await createFn(data);
          if (saved && idField && saved[idField] !== undefined && saved.id === undefined) {
            (saved as any).id = saved[idField];
          }
          return saved;
        };
      }
    }

    // Wrap update to normalize id field on returned entity
    if (!proxy.updateItem) {
      const updateFn = proxy.updateReport || proxy.update || proxy.updateItem;
      if (updateFn) {
        proxy.updateItem = async (id: string, data: any) => {
          const saved = await updateFn(id, data);
          if (saved && idField && saved[idField] !== undefined && saved.id === undefined) {
            (saved as any).id = saved[idField];
          }
          return saved;
        };
      }
    }

    // Ensure updateItemInList exists by delegating to existing method names if present
    if (!proxy.updateItemInList) {
      proxy.updateItemInList = proxy.updateItemInList || proxy.updateItem || proxy.updateReport;
    }

    return proxy;
  }, [store, schema]);

  const form = isDynamicForm
    ? useEntityFormWithStore<any, any>({
        entity: schema ? normalizedEntity : undefined,
        store: normalizedStore,
        createMethodName: 'createItem',
        updateMethodName: 'updateItem',
        entityToFormData: (entityData) => {
          if (!schema) return {};
          
          // Build form schema from formTabs fields (primary source)
          const allFormFields: any = {};
          
          // First, add fields from formTabs
          if (schema.formTabs) {
            schema.formTabs.forEach((tab: any) => {
              if (tab.sections) {
                tab.sections.forEach((section: any) => {
                  if (section.fields) {
                    section.fields.forEach((field: any) => {
                      allFormFields[field.name] = field;
                    });
                  }
                });
              }
            });
          }
          
          // Then, add fields from formFields (for backward compatibility)
          Object.entries(schema.formFields || {}).forEach(([fieldName, fieldDef]: [string, any]) => {
            if (!allFormFields[fieldName]) {
              allFormFields[fieldName] = fieldDef;
            }
          });
          
          // CRITICAL: Filter out fields with dbField: null (custom-rendered fields like "elements")
          const fieldsForForm: any = {};
          Object.entries(allFormFields).forEach(([fieldName, fieldDef]: [string, any]) => {
            if (fieldDef.dbField !== null) {
              fieldsForForm[fieldName] = fieldDef;
            }
          });
          
          const formSchema = createFormSchema(fieldsForForm);
          const formData = formSchema.fromApi(entityData);
          
          // Also include entityFields data
          Object.entries(schema.entityFields || {}).forEach(([fieldName, fieldDef]) => {
            if (fieldDef.showOn?.includes('form') && fieldDef.dbField !== null) {
              formData[fieldName] = entityData[fieldName];
            }
          });
          
          return formData;
        },
        getDefaultFormData: () => {
          if (!schema) return {};
          
          // Build form schema from formTabs fields (primary source)
          const allFormFields: any = {};
          
          // First, add fields from formTabs
          if (schema.formTabs) {
            schema.formTabs.forEach((tab: any) => {
              if (tab.sections) {
                tab.sections.forEach((section: any) => {
                  if (section.fields) {
                    section.fields.forEach((field: any) => {
                      allFormFields[field.name] = field;
                    });
                  }
                });
              }
            });
          }
          
          // Then, add fields from formFields (for backward compatibility)
          Object.entries(schema.formFields || {}).forEach(([fieldName, fieldDef]: [string, any]) => {
            if (!allFormFields[fieldName]) {
              allFormFields[fieldName] = fieldDef;
            }
          });
          
          // CRITICAL: Filter out fields with dbField: null (custom-rendered fields like "elements")
          const fieldsForDefaults: any = {};
          Object.entries(allFormFields).forEach(([fieldName, fieldDef]: [string, any]) => {
            if (fieldDef.dbField !== null) {
              fieldsForDefaults[fieldName] = fieldDef;
            }
          });
          
          const formSchema = createFormSchema(fieldsForDefaults);
          const defaults = formSchema.getDefaults();
          
          // Also include entityFields defaults
          Object.entries(schema.entityFields || {}).forEach(([fieldName, fieldDef]) => {
            if (fieldDef.showOn?.includes('form') && fieldDef.dbField !== null) {
              defaults[fieldName] = fieldDef.default;
            }
          });
          
          return defaults;
        },
        formDataToEntity: (formData) => {
          if (!schema) return {};
          
          // Build form schema from formTabs fields (primary source)
          const allFormFields: any = {};
          
          // First, add fields from formTabs
          if (schema.formTabs) {
            schema.formTabs.forEach((tab: any) => {
              if (tab.sections) {
                tab.sections.forEach((section: any) => {
                  if (section.fields) {
                    section.fields.forEach((field: any) => {
                      allFormFields[field.name] = field;
                    });
                  }
                });
              }
            });
          }
          
          // Then, add fields from formFields (for backward compatibility)
          Object.entries(schema.formFields || {}).forEach(([fieldName, fieldDef]: [string, any]) => {
            if (!allFormFields[fieldName]) {
              allFormFields[fieldName] = fieldDef;
            }
          });
          
          // CRITICAL: Filter out fields with dbField: null BEFORE calling toApi()
          // This prevents custom-rendered fields like "elements" from being included in the API payload
          const cleanFormData: any = { ...formData };
          Object.entries(allFormFields).forEach(([fieldName, fieldDef]: [string, any]) => {
            if (fieldDef.dbField === null) {
              delete cleanFormData[fieldName];
            }
          });
          
          const formSchema = createFormSchema(allFormFields);
          const apiData = formSchema.toApi(cleanFormData);
          const cleanData = { ...apiData };
          fieldsToClean.forEach(field => {
            delete cleanData[field];
          });
          
          // Return all data - let the store handle dirty field filtering if needed
          return cleanData;
        },
        updateStrategy: 'optimistic',
        onSuccess: async (savedEntity, mode) => {
          console.log(`[BaseForm] ${mode} successful:`, savedEntity.id);
          if (onLegacySubmit) {
            await onLegacySubmit(savedEntity);
          }
          onCancel?.();
        },
        onError: (error, mode) => {
          console.error(`[BaseForm] ${mode} failed:`, error);
          
          // Extract API error details
          let errorMessage = error.message || `Failed to ${mode} record`;
          let apiErrors: any = null;
          let errorDetails = '';
          
          if ('response' in error) {
            const response = (error as any).response;
            console.log('[BaseForm] Response object:', response);
            
            if (response?.data?.errors) {
              apiErrors = response.data.errors;
              // Format validation errors
              if (Array.isArray(apiErrors)) {
                errorDetails = apiErrors
                  .map((err: any) => `${err.path}: ${err.msg}`)
                  .join('<br/>');
              } else {
                errorDetails = JSON.stringify(apiErrors, null, 2);
              }
            }
            if (response?.data?.message) {
              errorMessage = response.data.message;
            }
          }
          
          // Display error toast
          console.error(`[BaseForm] Error details:`, { errorMessage, apiErrors, errorDetails });
          
          // Show error notification
          const errorNotification = document.createElement('div');
          errorNotification.className = 'form-error-toast';
          errorNotification.innerHTML = `
            <div class="form-error-toast__content">
              <span class="form-error-toast__icon">⚠️</span>
              <div class="form-error-toast__message">
                <strong>${errorMessage}</strong>
                ${errorDetails ? `<div class="form-error-toast__details">${errorDetails}</div>` : ''}
              </div>
              <button class="form-error-toast__close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
          `;
          document.body.appendChild(errorNotification);
          
          // Auto-remove after 7 seconds (longer for detailed errors)
          setTimeout(() => {
            if (errorNotification.parentElement) {
              errorNotification.remove();
            }
          }, 7000);
        },
      })
    : null;

  const validateForm = (): { isValid: boolean; newErrors: Record<string, string> } => {
    if (!isDynamicForm || !schema) return { isValid: true, newErrors: {} };

    const newErrors: Record<string, string> = {};

    console.log('[VALIDATION] Starting form validation...');
    console.log('[VALIDATION] Form data:', form?.formData);
    console.log('[VALIDATION] Schema fields:', Object.keys(schema.formFields));

    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      if (excludeFields.includes(fieldName)) {
        console.log(`[VALIDATION] Skipping excluded field: ${fieldName}`);
        return;
      }

      const value = form?.formData?.[fieldName];
      const backendFieldDef = fieldDef as BackendFieldDefinition & { validation?: boolean };

      console.log(`[VALIDATION] Checking field: ${fieldName}, value: ${value}, required: ${backendFieldDef.required}, showOn: ${backendFieldDef.showOn}`);

      if (backendFieldDef.showOn && !backendFieldDef.showOn.includes('form')) {
        console.log(`[VALIDATION] Skipping field not shown on form: ${fieldName}`);
        return;
      }

      if (backendFieldDef.required && (value === undefined || value === null || value === '')) {
        newErrors[fieldName] = `${backendFieldDef.label} is required`;
        console.log(`[VALIDATION] ❌ Required field missing: ${fieldName} (${backendFieldDef.label})`);
        return;
      }

      if (backendFieldDef.validation === false) {
        return;
      }

      // Skip validation for foreign key fields (validate: true) - they're validated by the backend
      if (backendFieldDef.validate === true) {
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (backendFieldDef.type === 'number') {
          // Convert string to number for validation
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (isNaN(numValue)) {
            newErrors[fieldName] = `${backendFieldDef.label} must be a number`;
          } else {
            if (backendFieldDef.min !== null && backendFieldDef.min !== undefined && numValue < backendFieldDef.min) {
              newErrors[fieldName] = `${backendFieldDef.label} must be at least ${backendFieldDef.min}`;
            }
            if (backendFieldDef.max !== null && backendFieldDef.max !== undefined && numValue > backendFieldDef.max) {
              newErrors[fieldName] = `${backendFieldDef.label} must be at most ${backendFieldDef.max}`;
            }
          }
        }

        if (backendFieldDef.type === 'string' && typeof value === 'string') {
          if (backendFieldDef.minLength && value.length < backendFieldDef.minLength) {
            newErrors[fieldName] = `${backendFieldDef.label} must be at least ${backendFieldDef.minLength} characters`;
          }
          if (backendFieldDef.maxLength && value.length > backendFieldDef.maxLength) {
            newErrors[fieldName] = `${backendFieldDef.label} must be at most ${backendFieldDef.maxLength} characters`;
          }
          if (backendFieldDef.pattern && !new RegExp(backendFieldDef.pattern).test(value)) {
            newErrors[fieldName] = `${backendFieldDef.label} format is invalid`;
          }
        }

        if (backendFieldDef.type === 'email' && typeof value === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors[fieldName] = 'Please enter a valid email address';
          }
        }

        // Validate enum values - check against original enumValues
        if (backendFieldDef.enumValues) {
          const enumValues = backendFieldDef.enumValues;
          if (!enumValues.includes(value)) {
            newErrors[fieldName] = `${backendFieldDef.label} must be one of: ${enumValues.join(', ')}`;
          }
        }
      }
    });

    const isValid = Object.keys(newErrors).length === 0;
    
    console.log('[VALIDATION] Setting errors:', newErrors);
    setErrors(newErrors);
    
    if (!isValid) {
      console.log('[VALIDATION] ❌ Form validation FAILED. Errors:', newErrors);
    } else {
      console.log('[VALIDATION] ✅ Form validation PASSED');
    }
    
    return { isValid, newErrors };
  };

  const handleDynamicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('========================================');
    console.log('[FORM SUBMIT] Form submission triggered');
    console.log('[FORM SUBMIT] Schema name:', schemaName);
    try {
      console.log('[FORM SUBMIT] Form data:', JSON.stringify(form?.formData, null, 2));
    } catch (e) {
      console.log('[FORM SUBMIT] Form data: (circular structure, cannot stringify)');
    }
    try {
      console.log('[FORM SUBMIT] Entity:', JSON.stringify(entity, null, 2));
    } catch (e) {
      console.log('[FORM SUBMIT] Entity: (circular structure, cannot stringify)');
    }
    console.log('========================================');

    // Validate form and get validation result with errors
    const { isValid, newErrors } = validateForm();
    
    if (!isValid || form?.isSubmitting) {
      console.log('[FORM SUBMIT] Validation failed or already submitting');
      console.log('[FORM SUBMIT] Validation errors:', newErrors);
      
      // Focus on the first field with an error - use newErrors directly
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        console.log('[FORM SUBMIT] First error field:', firstErrorField);
        
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField);
          if (errorElement) {
            console.log('[FORM SUBMIT] Focusing on field:', firstErrorField);
            errorElement.focus();
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            console.warn('[FORM SUBMIT] Could not find element with id:', firstErrorField);
            // If field is not in DOM (likely on inactive tab), find which tab it belongs to and switch to it
            if (schema?.formTabs && schema.formTabs.length > 0) {
              for (const tab of schema.formTabs) {
                if (tab.sections) {
                  for (const section of tab.sections) {
                    if (section.fields && section.fields.some((f: any) => f.name === firstErrorField)) {
                      console.log('[FORM SUBMIT] Field found in tab:', tab.name, '- switching to it');
                      setActiveTab(tab.name);
                      onTabChange?.(tab.name);
                      // Try focusing again after tab switch
                      setTimeout(() => {
                        const retryElement = document.getElementById(firstErrorField);
                        if (retryElement) {
                          retryElement.focus();
                          retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                      return;
                    }
                  }
                }
              }
            }
          }
        }, 100);
      }
      return;
    }

    try {
      console.log('[FORM SUBMIT] Calling handleSubmit...');
      console.log('[FORM SUBMIT] Form object:', form);
      console.log('[FORM SUBMIT] Form handleSubmit method:', form?.handleSubmit);
      if (!form) {
        console.error('[FORM SUBMIT] Form is null or undefined');
        return;
      }
      await form.handleSubmit();
      console.log('[FORM SUBMIT] Submit completed successfully');
    } catch (error) {
      console.error('[FORM SUBMIT] Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    console.log(`[BaseForm] handleInputChange called:`, { 
      field, 
      value, 
      hasForm: !!form,
      hasSetFormData: !!form?.setFormData,
      formData: form?.formData 
    });
    
    if (!form) {
      console.error(`[BaseForm] Form is null or undefined!`);
      return;
    }
    
    form.setFormData((prev: any) => {
      const newData = {
        ...prev,
        [field]: value,
      };
      console.log(`[BaseForm] Form data updated:`, { field, oldValue: prev[field], newValue: value, newData });
      return newData;
    });

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };



  const renderField = (fieldName: string, fieldDef: any) => {
    const value = form?.formData?.[fieldName];
    const error = errors[fieldName];
    const isFormDisabled = loading || !!form?.isSubmitting;

    const customField = renderCustomField?.(fieldName, fieldDef, value, error, isFormDisabled, (val) =>
      handleInputChange(fieldName, val)
    );
    if (customField !== null && customField !== undefined) {
      return customField;
    }

    // Handle validation fields (foreign key relationships)
    if (fieldDef.validate === true && fieldDef.type === 'number') {
      return (
        <ValidationFieldSelect
          key={fieldName}
          fieldName={fieldName}
          fieldDef={fieldDef}
          value={value}
          error={error}
          isDisabled={isFormDisabled}
          onChange={(val) => handleInputChange(fieldName, val)}
          className={className}
          validationDataProvider={validationDataProvider}
        />
      );
    }

    // Determine field type - handle special cases
    let fieldType = fieldDef.type || 'text';
    let fieldOptions = fieldDef.options;

    // Convert boolean to checkbox (which renders as Material Design Switch)
    if (fieldType === 'boolean') {
      fieldType = 'checkbox';
    }

    // Convert enumValues to select with options
    if (fieldDef.enumValues && !fieldOptions) {
      fieldType = 'select';
      fieldOptions = fieldDef.enumValues.map((val: string) => ({
        value: val,
        label: val.charAt(0).toUpperCase() + val.slice(1),
      }));
    }

    // Convert description/notes fields to textarea
    const isNoteField = ['description', 'notes', 'note', 'comments', 'comment', 'remarks', 'memo'].includes(fieldName.toLowerCase());
    if (isNoteField) {
      fieldType = 'textarea';
    }

    // Disable autocomplete for address fields to prevent Chrome's save address dialog
    const addressFields = ['street', 'street2', 'city', 'state', 'zip', 'country', 'address'];
    const isAddressField = addressFields.includes(fieldName.toLowerCase());

    // Filter out schema-specific properties that shouldn't be passed to FormField
    const validFormFieldProps = {
      name: isAddressField ? `field_${fieldName}` : fieldName,
      label: fieldDef.label,
      type: fieldType === 'phone' ? 'tel' : fieldType,
      value: fieldType === 'checkbox' ? (value || false) : (value || ''),
      error,
      touched: !!error,
      help: fieldDef.description,
      required: fieldDef.required,
      disabled: isFormDisabled,
      placeholder: fieldDef.placeholder,
      options: fieldOptions,
      min: fieldDef.min,
      max: fieldDef.max,
      step: fieldDef.step,
      rows: fieldDef.rows || (isNoteField ? 6 : (fieldType === 'textarea' ? 4 : undefined)),
      onChange: (e: any) => {
        if (fieldType === 'checkbox') {
          handleInputChange(fieldName, e.target.checked);
        } else {
          handleInputChange(fieldName, e.target.value);
        }
      },
      onBlur: () => {},
    };

    return (
      <div key={fieldName} className={`${className}__field`}>
        <FormField {...validFormFieldProps} />
      </div>
    );
  };

  // Dynamic form loading state
  if (isDynamicForm && schemaLoading) {
    return (
      <div className={formClassName}>
        <div className="form-loading">Loading form schema...</div>
      </div>
    );
  }

  // Dynamic form error state
  if (isDynamicForm && schemaError) {
    return (
      <div className={formClassName}>
        <div className="form-error-banner">
          <span className="error-icon">⚠️</span>
          <span>Failed to load form schema: {schemaError.message}</span>
        </div>
      </div>
    );
  }

  if (isDynamicForm && !schema) {
    return null;
  }

  // Sidebar removed from framework-level forms. Callers can still opt to render their own sidebars

  const handleFormSubmit = isDynamicForm ? handleDynamicSubmit : onSubmit;

  // Determine layout based on schema metadata or fieldSections
  const getLayoutInfo = () => {
    // Use fieldSections prop if provided, otherwise use formTabsFieldSections from formTabs
    const sectionsToUse = fieldSections || (schema?.formTabs ? formTabsFieldSections : undefined);
    
    console.log('[BaseForm] getLayoutInfo:', {
      sectionsToUse,
      sectionCount: Object.keys(sectionsToUse || {}).length,
      hasFieldSectionsProp: !!fieldSections,
      hasFormTabsFieldSections: !!formTabsFieldSections,
    });
    
    if (!isDynamicForm || !sectionsToUse || Object.keys(sectionsToUse).length === 0) {
      console.log('[BaseForm] No sections to use, returning empty layout');
      return { gridClass: '', sectionClasses: {} };
    }

    const sectionCount = Object.keys(sectionsToUse).length;
    let gridClass = '';
    const sectionClasses: Record<string, string> = {};

    console.log('[BaseForm] Calculating layout for', sectionCount, 'sections');

    // Determine grid layout based on number of sections
    if (sectionCount === 1) {
      gridClass = 'base-form__main--grid-1';
    } else if (sectionCount === 2) {
      gridClass = 'base-form__main--grid-2';
    } else if (sectionCount >= 3) {
      gridClass = 'base-form__main--grid-3';
    }

    console.log('[BaseForm] Using grid class:', gridClass);

    // Assign section positioning classes
    const sectionNames = Object.keys(sectionsToUse);
    sectionNames.forEach((sectionName) => {
      // Don't assign positioning classes - let the grid handle it
      sectionClasses[sectionName] = '';
    });

    console.log('[BaseForm] Section classes:', sectionClasses);

    return { gridClass, sectionClasses };
  };

  const { gridClass, sectionClasses } = getLayoutInfo();

  // Determine if we should use flexbox or grid layout
  const shouldUseFlexbox = () => {
    const sectionsToRender = fieldSections || formTabsFieldSections || {};
    const sections = schema?.formTabs
      ?.flatMap(tab => tab.sections || [])
      .filter(sec => Object.keys(sectionsToRender).includes(sec.name)) || [];
    
    // Use flexbox if any section has flex properties
    return sections.some(sec => 
      sec.flex !== undefined || 
      sec.flexGrow !== undefined || 
      sec.flexShrink !== undefined
    );
  };

  // Only render form content if we have determined the tab structure
  // This prevents fields from flashing before tabs are organized
  const shouldRenderFormContent = !isDynamicForm || (schema && (tabList.length > 0 || !schema.formTabs));

  // Render dynamic form sections
  const useFlexbox = shouldUseFlexbox();
  const containerClass = useFlexbox 
    ? 'base-form__sections-container--flex'
    : `base-form__sections-container base-form__sections-container--grid-${Object.keys(fieldSections || formTabsFieldSections || {}).length || 1}`;
  
  const formContent = shouldRenderFormContent && isDynamicForm ? (
    <div className={containerClass}>
      {/* Render sections from formTabs if available, otherwise use fieldSections prop */}
      {(() => {
        const sectionsToRender = fieldSections || formTabsFieldSections || {};
        const sectionEntries = Object.entries(sectionsToRender);
        console.log('[BaseForm] formContent render:', {
          sectionsToRender,
          sectionCount: sectionEntries.length,
          willRenderSections: sectionEntries.length > 0,
        });
        
        if (sectionEntries.length > 0) {
          return sectionEntries.map(
            ([sectionTitle, fieldNames]) => {
              console.log('[BaseForm] Rendering section:', {
                sectionTitle,
                fieldNames,
                isArray: Array.isArray(fieldNames),
              });
              
              // fieldNames should always be an array from useFormTabs
              const visibleFields = (Array.isArray(fieldNames) ? fieldNames : []).filter(f => !excludeFields.includes(f));
              console.log('[BaseForm] Visible fields in section:', { sectionTitle, visibleFields });
              
              if (visibleFields.length === 0) {
                console.log('[BaseForm] Section has no visible fields, skipping');
                return null;
              }

              const sectionLayoutClass = sectionClasses[sectionTitle] || '';
              
              // Get width and flex properties from schema if available
              const sectionData = schema?.formTabs
                ?.flatMap(tab => tab.sections || [])
                .find(sec => sec.name === sectionTitle);
              const sectionMinWidth = sectionData?.minWidth;
              const sectionMaxWidth = sectionData?.maxWidth;
              const sectionFlex = sectionData?.flex;
              const sectionFlexGrow = sectionData?.flexGrow;
              const sectionFlexShrink = sectionData?.flexShrink;
              
              console.log('[BaseForm] Section layout:', { sectionTitle, sectionMinWidth, sectionMaxWidth, sectionFlex, sectionFlexGrow, sectionFlexShrink });

              return (
                <div 
                  key={sectionTitle} 
                  className={`${className}__section ${sectionLayoutClass}${useFlexbox ? ' base-form__section--flex' : ''}`}
                  data-min-width={sectionMinWidth}
                  data-max-width={sectionMaxWidth}
                  data-flex={sectionFlex}
                  data-flex-grow={sectionFlexGrow}
                  data-flex-shrink={sectionFlexShrink}
                >
                  <h3 className={`${className}__section-title`}>{sectionTitle}</h3>
                  {visibleFields.map(fieldName => {
                    // Check formFields first, then entityFields
                    const fieldDef = schema?.formFields?.[fieldName] || schema?.entityFields?.[fieldName];
                    console.log('[BaseForm] Rendering field:', { fieldName, hasFieldDef: !!fieldDef });
                    return fieldDef ? <div key={fieldName}>{renderField(fieldName, fieldDef)}</div> : null;
                  })}
                </div>
              );
            }
          );
        } else {
          // Fallback: render all form fields if no sections are defined
          console.log('[BaseForm] No sections, rendering all form fields as fallback');
          const allFields = Object.keys(schema?.formFields || {})
            .filter(f => !excludeFields.includes(f));
          console.log('[BaseForm] All fields to render:', allFields);
          
          return allFields.map(fieldName => {
            const fieldDef = schema?.formFields?.[fieldName];
            return fieldDef ? <div key={fieldName}>{renderField(fieldName, fieldDef)}</div> : null;
          });
        }
      })()}
      
      {/* Render entity fields that have showOn: ['form'] but are not in fieldSections */}
      {Object.entries(schema?.entityFields || {}).some(([fieldName, fieldDef]) => 
        fieldDef.showOn?.includes('form') && 
        !excludeFields.includes(fieldName) &&
        !Object.values(fieldSections || formTabsFieldSections || {}).flat().includes(fieldName)
      ) && (
        <div className={`${className}__section`}>
          {Object.entries(schema?.entityFields || {}).map(([fieldName, fieldDef]) => {
            if (!fieldDef.showOn?.includes('form') || excludeFields.includes(fieldName)) {
              return null;
            }
            // Skip if already in fieldSections
            if (Object.values(fieldSections || formTabsFieldSections || {}).flat().includes(fieldName)) {
              return null;
            }
            
            return <div key={fieldName}>{renderField(fieldName, fieldDef)}</div>;
          })}
        </div>
      )}
    </div>
  ) : (
    children
  );

  return (
    <form 
      id={`form-${schemaName || 'base'}`}
      onSubmit={handleFormSubmit} 
      className={formClassName} 
      autoComplete="off"
      data-max-width={formMaxWidth || '900px'}
      data-min-width={formMinWidth}
    >
      {/* Render tabs if using formTabs structure and showTabs is true */}
      {showTabs && schema?.formTabs && tabList.length > 0 && (
        <FormTabs
          tabs={allTabs}
          tabList={tabList}
          activeTab={effectiveActiveTab}
          onTabChange={(tabName) => {
            setActiveTab(tabName);
            onTabChange?.(tabName);
          }}
          className={`${className}__tabs`}
        />
      )}
      
      <div className="base-form__content">
        <div className={`base-form__main ${gridClass}`}>
          {shouldRenderFormContent ? formContent : null}
        </div>

        {/* Sidebar intentionally removed at framework level */}
      </div>
    </form>
  );
};
        // <Sidebar sections={allSidebarSections}>
        //   {sidebarChildren}
        // </Sidebar>

export default BaseForm;
