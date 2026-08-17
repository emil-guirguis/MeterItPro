import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  BaseFormConfig,
  BaseFormReturn,
  ValidationErrors,
  FormState,
} from '../types/form';
import { validateField as validateFieldUtil } from '../utils/validation';

/**
 * Base form hook for managing form state, validation, and submission
 * 
 * @example
 * ```tsx
 * const form = useBaseForm({
 *   initialValues: { name: '', email: '' },
 *   validationSchema: {
 *     name: [{ type: 'required', message: 'Name is required' }],
 *     email: [
 *       { type: 'required', message: 'Email is required' },
 *       { type: 'email', message: 'Invalid email' }
 *     ]
 *   },
 *   onSubmit: async (values) => {
 *     await api.submit(values);
 *   }
 * });
 * ```
 */
export function useBaseForm<T = any>(config: BaseFormConfig<T>): BaseFormReturn<T> {
  const {
    initialValues,
    validationSchema = {},
    onSubmit,
    authContext,
    permissions,
    validateOnChange = false,
    validateOnBlur = true,
  } = config;

  // Form state
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Track initial values to determine if form is dirty
  const initialValuesRef = useRef(initialValues);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  const isValid = Object.keys(errors).length === 0;

  // Update values when initialValues change (e.g., when editing different records)
  useEffect(() => {
    setValues(initialValues);
    initialValuesRef.current = initialValues;
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Check if user has permission to read a field
   */
  const canReadField = useCallback((): boolean => {
    if (!authContext || !permissions?.read) return true;
    
    const readPerms = Array.isArray(permissions.read) ? permissions.read : [permissions.read];
    return readPerms.some(perm => authContext.checkPermission(perm));
  }, [authContext, permissions]);

  /**
   * Check if user has permission to update a field
   */
  const canUpdateField = useCallback((): boolean => {
    if (!authContext || !permissions?.update) return true;
    
    const updatePerms = Array.isArray(permissions.update) ? permissions.update : [permissions.update];
    return updatePerms.some(perm => authContext.checkPermission(perm));
  }, [authContext, permissions]);

  /**
   * Validate a single field
   */
  const validateField = useCallback(async (field: string): Promise<string | undefined> => {
    const fieldRules = (validationSchema as any)[field];
    if (!fieldRules || fieldRules.length === 0) return undefined;

    const fieldValue = (values as any)[field];
    const error = validateFieldUtil(fieldValue, fieldRules, values);
    
    return error;
  }, [validationSchema, values]);

  /**
   * Validate entire form
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    const newErrors: ValidationErrors = {};

    // Validate all fields that have validation rules
    for (const field of Object.keys(validationSchema)) {
      const error = await validateField(field);
      if (error) {
        newErrors[field] = error;
      }
    }

    setErrors(newErrors);
    setIsValidating(false);
    return Object.keys(newErrors).length === 0;
  }, [validationSchema, validateField]);

  /**
   * Set value for a specific field
   */
  const setFieldValue = useCallback((field: keyof T | string, value: any) => {
    setValues(prev => {
      // Handle nested field names (e.g., 'address.street')
      if (typeof field === 'string' && field.includes('.')) {
        const keys = field.split('.');
        const newValues = { ...prev };
        let current: any = newValues;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          current[key] = { ...(current[key] || {}) };
          current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        return newValues;
      }
      
      return { ...prev, [field]: value };
    });

    // Validate on change if enabled
    if (validateOnChange) {
      validateField(field as string).then(error => {
        setErrors(prev => {
          if (error) {
            return { ...prev, [field]: error };
          } else {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
          }
        });
      });
    } else {
      // Clear error when user starts typing
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [validateOnChange, validateField]);

  /**
   * Set error for a specific field
   */
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  /**
   * Set touched state for a specific field
   */
  const setFieldTouched = useCallback((field: string, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  /**
   * Reset form to initial or provided values
   */
  const resetForm = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues || initialValues;
    setValues(resetValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
    initialValuesRef.current = resetValues;
  }, [initialValues]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setSubmitCount(prev => prev + 1);

    // Validate form
    const isFormValid = await validateForm();
    if (!isFormValid) {
      return;
    }

    // Check permissions
    if (!canUpdateField()) {
      console.error('User does not have permission to submit this form');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values as T);
      // Reset form after successful submission if desired
      // resetForm();
    } catch (error) {
      console.error('Form submission error:', error);
      // You might want to set a general form error here
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit, canUpdateField]);

  /**
   * Handle field change event
   */
  const handleChange = useCallback((field: keyof T | string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = e.target;
      const value = target.type === 'checkbox' 
        ? (target as HTMLInputElement).checked 
        : target.value;
      
      setFieldValue(field, value);
    };
  }, [setFieldValue]);

  /**
   * Handle field blur event
   */
  const handleBlur = useCallback((field: string) => {
    return () => {
      setFieldTouched(field, true);
      
      // Validate on blur if enabled
      if (validateOnBlur) {
        validateField(field).then(error => {
          if (error) {
            setFieldError(field, error);
          }
        });
      }
    };
  }, [validateOnBlur, validateField, setFieldError, setFieldTouched]);

  /**
   * Get props for a field (convenience method)
   */
  const getFieldProps = useCallback((field: keyof T | string) => {
    const fieldName = field as string;
    let fieldValue = (values as any)[field];
    
    // Handle nested field names
    if (fieldName.includes('.')) {
      const keys = fieldName.split('.');
      fieldValue = keys.reduce((obj, key) => obj?.[key], values as any);
    }

    return {
      name: fieldName,
      value: fieldValue ?? '',
      onChange: handleChange(field),
      onBlur: handleBlur(fieldName),
    };
  }, [values, handleChange, handleBlur]);

  /**
   * Get metadata for a field (convenience method)
   */
  const getFieldMeta = useCallback((field: string) => {
    let fieldValue = (values as any)[field];
    
    // Handle nested field names
    if (field.includes('.')) {
      const keys = field.split('.');
      fieldValue = keys.reduce((obj, key) => obj?.[key], values as any);
    }

    return {
      error: errors[field],
      touched: touched[field] || false,
      value: fieldValue,
    };
  }, [values, errors, touched]);

  const formState: FormState<T> = {
    values,
    errors,
    touched,
    isSubmitting,
    isValidating,
    isDirty,
    isValid,
    submitCount,
  };

  const formActions = {
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    resetForm,
    validateField,
    validateForm,
    handleSubmit,
    handleChange,
    handleBlur,
    getFieldProps,
    getFieldMeta,
    canReadField,
    canUpdateField,
  };

  return {
    ...formState,
    ...formActions,
  };
}
