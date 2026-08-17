import type { AuthContextProvider } from '../../list/types/list';

/**
 * Validation rule types
 */
export type ValidationRuleType = 
  | 'required' 
  | 'email' 
  | 'min' 
  | 'max' 
  | 'minLength'
  | 'maxLength'
  | 'pattern' 
  | 'custom'
  | 'url'
  | 'phone'
  | 'zipCode';

/**
 * Single validation rule
 */
export interface ValidationRule {
  type: ValidationRuleType;
  message: string;
  value?: any;
  validator?: (value: any, formData?: any) => boolean;
}

/**
 * Validation schema for a form
 * Maps field names to arrays of validation rules
 */
export interface ValidationSchema {
  [K: string]: ValidationRule[];
}

/**
 * Validation errors object
 * Maps field names to error messages
 */
export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Form permissions for field-level access control
 */
export interface FormPermissions {
  read?: string | string[];
  update?: string | string[];
}

/**
 * Field-level permissions
 */
export interface FieldPermissions {
  read?: string | string[];
  update?: string | string[];
}

/**
 * Form field configuration
 */
export interface FormFieldConfig<T = any> {
  name: keyof T | string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: any; label: string }>;
  permissions?: FieldPermissions;
  rows?: number; // For textarea
  min?: number; // For number inputs
  max?: number; // For number inputs
  step?: number; // For number inputs
}

/**
 * Form section configuration
 */
export interface FormSectionConfig {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
}

/**
 * Base form configuration
 */
export interface BaseFormConfig<T = any> {
  initialValues: Partial<T>;
  validationSchema?: ValidationSchema;
  onSubmit: (values: T) => Promise<void>;
  authContext?: AuthContextProvider;
  permissions?: FormPermissions;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Form state
 */
export interface FormState<T = any> {
  values: Partial<T>;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
  submitCount: number;
}

/**
 * Form actions
 */
export interface FormActions<T = any> {
  setFieldValue: (field: keyof T | string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  setFieldTouched: (field: string, touched: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: ValidationErrors) => void;
  resetForm: (values?: Partial<T>) => void;
  validateField: (field: string) => Promise<string | undefined>;
  validateForm: () => Promise<boolean>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleChange: (field: keyof T | string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: string) => (e: React.FocusEvent) => void;
}

/**
 * Return type for useBaseForm hook
 */
export interface BaseFormReturn<T = any> extends FormState<T>, FormActions<T> {
  // Convenience methods
  getFieldProps: (field: keyof T | string) => {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: (e: React.FocusEvent) => void;
  };
  getFieldMeta: (field: string) => {
    error?: string;
    touched: boolean;
    value: any;
  };
  canReadField: (field: string) => boolean;
  canUpdateField: (field: string) => boolean;
}

/**
 * Form submission result
 */
export interface FormSubmitResult {
  success: boolean;
  errors?: ValidationErrors;
  data?: any;
}

/**
 * Configuration for entity form initialization
 */
export interface EntityFormConfig<TEntity, TFormData> {
  entity?: TEntity;
  entityToFormData: (entity: TEntity) => TFormData;
  getDefaultFormData: () => TFormData;
  onInitialize?: (formData: TFormData, mode: 'create' | 'edit') => void;
  /** Name of the entity for validation logging (e.g., 'Contact', 'User') */
  entityName?: string;
  /** Enable automatic field validation (default: true in development) */
  validateFields?: boolean;
}

/**
 * Return type for useEntityForm hook
 */
export interface EntityFormReturn<TFormData> {
  formData: TFormData;
  setFormData: React.Dispatch<React.SetStateAction<TFormData>>;
  isEditMode: boolean;
  updateField: (field: string, value: any) => void;
  resetForm: () => void;
  dirtyFields: Set<string>;
}

/**
 * Update strategy for list synchronization after form submission
 * - 'optimistic': Updates list immediately using saved entity (faster, recommended)
 * - 'reload': Fetches entire list from API after save (slower, but ensures consistency)
 */
export type UpdateStrategy = 'optimistic' | 'reload';

/**
 * Enhanced store interface that includes create/update methods and optimistic update methods
 */
export interface EntityStore<T> {
  /** Create a new entity */
  createItem?: (data: Partial<T>) => Promise<T>;
  /** Update an existing entity */
  updateItem?: (id: string, data: Partial<T>) => Promise<T>;
  /** Fetch all entities from the API */
  fetchItems?: () => Promise<void>;
  
  /** Add an item to the list (optimistic update) */
  addItemToList?: (item: T) => void;
  /** Update an item in the list (optimistic update) */
  updateItemInList?: (item: T) => void;
  
  // Alternative method names (some stores use these)
  create?: (data: Partial<T>) => Promise<T>;
  update?: (id: string, data: Partial<T>) => Promise<T>;
  
  [key: string]: any; // Allow other store methods
}

/**
 * Configuration for useEntityFormWithStore
 */
export interface EntityFormWithStoreConfig<TEntity, TFormData> 
  extends Omit<EntityFormConfig<TEntity, TFormData>, 'onInitialize'> {
  /** Entity store with create/update methods */
  store: EntityStore<TEntity>;
  /** Callback after successful save */
  onSuccess?: (savedEntity: TEntity, mode: 'create' | 'update') => void;
  /** Callback on error */
  onError?: (error: Error, mode: 'create' | 'update') => void;
  /** Transform form data to entity data before saving */
  formDataToEntity?: (formData: TFormData) => Partial<TEntity>;
  
  /**
   * Update strategy for list synchronization after form submission
   * - 'optimistic': Updates list immediately using saved entity (default, faster)
   * - 'reload': Fetches entire list from API after save (slower, but ensures consistency)
   * @default 'optimistic'
   */
  updateStrategy?: UpdateStrategy;
  
  /**
   * Whether to refresh the list after save
   * @deprecated Use `updateStrategy` instead. This parameter is kept for backward compatibility.
   * When set to true, it behaves like updateStrategy='reload'. When false, no list update occurs.
   */
  refreshAfterSave?: boolean;
  
  /** Custom create method name if store uses different naming */
  createMethodName?: string;
  /** Custom update method name if store uses different naming */
  updateMethodName?: string;
}

/**
 * Return type for useEntityFormWithStore
 */
export interface EntityFormWithStoreReturn<TFormData> extends EntityFormReturn<TFormData> {
  /** Submit handler that calls store methods */
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Error from last submission */
  submitError: Error | null;
}
