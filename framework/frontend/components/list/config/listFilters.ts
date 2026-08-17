/**
 * List Component Framework - Filter Definition Helpers
 * 
 * Provides helper functions for creating common filter types with consistent
 * behavior. These helpers reduce boilerplate when defining filters for list
 * components.
 */

import type { FilterDefinition } from '../types/list';
import type { FilterOption } from '../types/ui';

/**
 * Create a text input filter.
 * 
 * @param key - Filter key (maps to store filter)
 * @param label - Filter label
 * @param options - Additional options
 * @returns Filter definition
 * 
 * @example
 * createTextFilter('search', 'Search', { placeholder: 'Search by name...' })
 */
export function createTextFilter(
  key: string,
  label: string,
  options?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
  }
): FilterDefinition {
  return {
    key,
    label,
    type: 'text',
    placeholder: options?.placeholder || `Filter by ${label.toLowerCase()}`,
    className: options?.className,
    storeKey: options?.storeKey,
  };
}

/**
 * Create a select dropdown filter with static options.
 * 
 * @param key - Filter key (maps to store filter)
 * @param label - Filter label
 * @param options - Filter options
 * @param config - Additional configuration
 * @returns Filter definition
 * 
 * @example
 * createSelectFilter('status', 'Status', [
 *   { label: 'Active', value: 'active' },
 *   { label: 'Inactive', value: 'inactive' }
 * ])
 */
export function createSelectFilter(
  key: string,
  label: string,
  options: FilterOption[],
  config?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
  }
): FilterDefinition {
  return {
    key,
    label,
    type: 'select',
    options,
    placeholder: config?.placeholder || `All ${label}`,
    className: config?.className,
    storeKey: config?.storeKey,
  };
}

/**
 * Create a select dropdown filter with dynamic options extracted from data.
 * 
 * @param key - Filter key (maps to store filter)
 * @param label - Filter label
 * @param extractKey - Property key to extract unique values from
 * @param config - Additional configuration
 * @returns Filter definition
 * 
 * @example
 * createDynamicSelectFilter('industry', 'Industry', 'industry')
 * createDynamicSelectFilter('category', 'Category', 'category', {
 *   transform: (value) => value.toUpperCase()
 * })
 */
export function createDynamicSelectFilter<T = any>(
  key: string,
  label: string,
  extractKey: keyof T & string,
  config?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
    transform?: (value: any) => string;
    sort?: boolean;
  }
): FilterDefinition {
  return {
    key,
    label,
    type: 'select',
    options: (items: T[]) => {
      // Extract unique values
      const uniqueValues = items
        .map(item => item[extractKey])
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);
      
      // Sort if requested
      const values = config?.sort !== false 
        ? uniqueValues.sort()
        : uniqueValues;
      
      // Transform and map to options
      return values.map(value => ({
        label: config?.transform ? config.transform(value) : String(value),
        value: String(value),
      }));
    },
    placeholder: config?.placeholder || `All ${label}`,
    className: config?.className,
    storeKey: config?.storeKey,
  };
}

/**
 * Create a status filter with predefined active/inactive options.
 * 
 * @param key - Filter key (default: 'status')
 * @param options - Additional options
 * @returns Filter definition
 * 
 * @example
 * createStatusFilter()
 * createStatusFilter('status', { 
 *   activeLabel: 'Online', 
 *   inactiveLabel: 'Offline' 
 * })
 */
export function createStatusFilter(
  key: string = 'status',
  options?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
    activeLabel?: string;
    inactiveLabel?: string;
    includeOther?: boolean;
  }
): FilterDefinition {
  const filterOptions: FilterOption[] = [
    { label: options?.activeLabel || 'Active', value: 'active' },
    { label: options?.inactiveLabel || 'Inactive', value: 'inactive' },
  ];
  
  if (options?.includeOther) {
    filterOptions.push({ label: 'Maintenance', value: 'maintenance' });
  }
  
  return {
    key,
    label: 'Status',
    type: 'select',
    options: filterOptions,
    placeholder: options?.placeholder || 'All Status',
    className: options?.className,
    storeKey: options?.storeKey,
  };
}

/**
 * Create a date filter.
 * 
 * @param key - Filter key
 * @param label - Filter label
 * @param options - Additional options
 * @returns Filter definition
 * 
 * @example
 * createDateFilter('createdAfter', 'Created After')
 * createDateFilter('startDate', 'Start Date', { placeholder: 'Select date' })
 */
export function createDateFilter(
  key: string,
  label: string,
  options?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
  }
): FilterDefinition {
  return {
    key,
    label,
    type: 'date',
    placeholder: options?.placeholder,
    className: options?.className,
    storeKey: options?.storeKey,
  };
}

/**
 * Create a role/category filter with common role options.
 * 
 * @param key - Filter key (default: 'category')
 * @param options - Role options
 * @param config - Additional configuration
 * @returns Filter definition
 * 
 * @example
 * createRoleFilter('category', [
 *   { label: 'Customer', value: 'customer' },
 *   { label: 'Vendor', value: 'vendor' }
 * ])
 */
export function createRoleFilter(
  key: string = 'category',
  options: FilterOption[],
  config?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
    label?: string;
  }
): FilterDefinition {
  return {
    key,
    label: config?.label || 'Role',
    type: 'select',
    options,
    placeholder: config?.placeholder || 'All Roles',
    className: config?.className,
    storeKey: config?.storeKey,
  };
}

/**
 * Create a boolean filter (Yes/No).
 * 
 * @param key - Filter key
 * @param label - Filter label
 * @param options - Additional options
 * @returns Filter definition
 * 
 * @example
 * createBooleanFilter('verified', 'Verified')
 * createBooleanFilter('active', 'Active', { 
 *   trueLabel: 'Yes', 
 *   falseLabel: 'No' 
 * })
 */
export function createBooleanFilter(
  key: string,
  label: string,
  options?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
    trueLabel?: string;
    falseLabel?: string;
  }
): FilterDefinition {
  return {
    key,
    label,
    type: 'select',
    options: [
      { label: options?.trueLabel || 'Yes', value: 'true' },
      { label: options?.falseLabel || 'No', value: 'false' },
    ],
    placeholder: options?.placeholder || `All ${label}`,
    className: options?.className,
    storeKey: options?.storeKey,
  };
}

/**
 * Create a multiselect filter (for future implementation).
 * Note: This requires additional UI component support.
 * 
 * @param key - Filter key
 * @param label - Filter label
 * @param options - Filter options
 * @param config - Additional configuration
 * @returns Filter definition
 * 
 * @example
 * createMultiSelectFilter('tags', 'Tags', [
 *   { label: 'Important', value: 'important' },
 *   { label: 'Urgent', value: 'urgent' }
 * ])
 */
export function createMultiSelectFilter(
  key: string,
  label: string,
  options: FilterOption[],
  config?: {
    placeholder?: string;
    className?: string;
    storeKey?: string;
  }
): FilterDefinition {
  return {
    key,
    label,
    type: 'multiselect',
    options,
    placeholder: config?.placeholder || `Select ${label}`,
    className: config?.className,
    storeKey: config?.storeKey,
  };
}

/**
 * Create a common set of filters for contact-like entities.
 * 
 * @param config - Configuration for which filters to include
 * @returns Array of filter definitions
 * 
 * @example
 * createContactFilters({ 
 *   includeRole: true, 
 *   includeStatus: true,
 *   includeIndustry: true 
 * })
 */
export function createContactFilters(config?: {
  includeRole?: boolean;
  includeStatus?: boolean;
  includeIndustry?: boolean;
  roleOptions?: FilterOption[];
}): FilterDefinition[] {
  const filters: FilterDefinition[] = [];
  
  if (config?.includeRole) {
    filters.push(
      createRoleFilter('category', config.roleOptions || [
        { label: 'Customer', value: 'customer' },
        { label: 'Vendor', value: 'vendor' },
      ])
    );
  }
  
  if (config?.includeStatus) {
    filters.push(createStatusFilter());
  }
  
  if (config?.includeIndustry) {
    filters.push(
      createDynamicSelectFilter('industry', 'Industry', 'industry')
    );
  }
  
 
  return filters;
}

/**
 * Create a common set of filters for user-like entities.
 * 
 * @param config - Configuration for which filters to include
 * @returns Array of filter definitions
 * 
 * @example
 * createUserFilters({ includeRole: true, includeStatus: true })
 */
export function createUserFilters(config?: {
  includeRole?: boolean;
  includeStatus?: boolean;
  roleOptions?: FilterOption[];
}): FilterDefinition[] {
  const filters: FilterDefinition[] = [];
  
  if (config?.includeRole) {
    filters.push(
      createRoleFilter('role', config.roleOptions || [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Manager', value: 'manager' },
      ], { label: 'Role' })
    );
  }
  
  if (config?.includeStatus) {
    filters.push(createStatusFilter());
  }
  
  return filters;
}

/**
 * Create a common set of filters for device/meter-like entities.
 * 
 * @param config - Configuration for which filters to include
 * @returns Array of filter definitions
 * 
 * @example
 * createDeviceFilters({ includeStatus: true, includeType: true })
 */
export function createDeviceFilters(config?: {
  includeStatus?: boolean;
  includeType?: boolean;
  includeLocation?: boolean;
  typeOptions?: FilterOption[];
}): FilterDefinition[] {
  const filters: FilterDefinition[] = [];
  
  if (config?.includeStatus) {
    filters.push(createStatusFilter('status', { includeOther: true }));
  }
  
  if (config?.includeType) {
    filters.push(
      createSelectFilter('type', 'Type', config.typeOptions || [
        { label: 'BACnet', value: 'bacnet' },
      ])
    );
  }
  
  if (config?.includeLocation) {
    filters.push(
      createDynamicSelectFilter('location', 'Location', 'locationName')
    );
  }
  
  return filters;
}
