/**
 * List Component Framework - Bulk Action Helpers
 * 
 * Provides helper functions for creating common bulk action configurations
 * with consistent behavior. These helpers reduce boilerplate when defining
 * bulk actions for list components.
 */

import type { BulkActionConfig } from '../types/list';
import type { Permission } from '../types/ui';

/**
 * Create a bulk activate action.
 * 
 * @param entityName - Entity name (singular) for messages
 * @param entityNamePlural - Entity name (plural) for messages
 * @param updateFunction - Function to update status in store
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createActivateAction('contact', 'contacts', 
 *   (ids) => store.bulkUpdateStatus(ids, 'active'),
 *   { requirePermission: Permission.CONTACT_UPDATE }
 * )
 */
export function createActivateAction<T>(
  entityName: string,
  entityNamePlural: string,
  updateFunction: (ids: string[], status: string) => Promise<void>,
  options?: {
    requirePermission?: Permission;
    confirmMessage?: string | ((items: T[]) => string);
  }
): BulkActionConfig<T> {
  return {
    id: 'activate',
    label: 'Activate',
    icon: 'check-circle',
    color: 'success',
    confirm: true,
    confirmMessage: options?.confirmMessage || ((items: T[]) => 
      `Are you sure you want to activate ${items.length} ${items.length === 1 ? entityName : entityNamePlural}?`
    ),
    action: async (items: T[]) => {
      const ids = items.map((item: any) => item.id);
      await updateFunction(ids, 'active');
    },
    requirePermission: options?.requirePermission,
  };
}

/**
 * Create a bulk deactivate action.
 * 
 * @param entityName - Entity name (singular) for messages
 * @param entityNamePlural - Entity name (plural) for messages
 * @param updateFunction - Function to update status in store
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createDeactivateAction('user', 'users',
 *   (ids) => store.bulkUpdateStatus(ids, 'inactive'),
 *   { requirePermission: Permission.USER_UPDATE }
 * )
 */
export function createDeactivateAction<T>(
  entityName: string,
  entityNamePlural: string,
  updateFunction: (ids: string[], status: string) => Promise<void>,
  options?: {
    requirePermission?: Permission;
    confirmMessage?: string | ((items: T[]) => string);
  }
): BulkActionConfig<T> {
  return {
    id: 'deactivate',
    label: 'Deactivate',
    icon: 'x-circle',
    color: 'warning',
    confirm: true,
    confirmMessage: options?.confirmMessage || ((items: T[]) => 
      `Are you sure you want to deactivate ${items.length} ${items.length === 1 ? entityName : entityNamePlural}?`
    ),
    action: async (items: T[]) => {
      const ids = items.map((item: any) => item.id);
      await updateFunction(ids, 'inactive');
    },
    requirePermission: options?.requirePermission,
  };
}

/**
 * Create a bulk maintenance mode action.
 * 
 * @param entityName - Entity name (singular) for messages
 * @param entityNamePlural - Entity name (plural) for messages
 * @param updateFunction - Function to update status in store
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createMaintenanceAction('meter', 'meters',
 *   (ids) => store.bulkUpdateStatus(ids, 'maintenance'),
 *   { requirePermission: Permission.METER_UPDATE }
 * )
 */
export function createMaintenanceAction<T>(
  entityName: string,
  entityNamePlural: string,
  updateFunction: (ids: string[], status: string) => Promise<void>,
  options?: {
    requirePermission?: Permission;
    confirmMessage?: string | ((items: T[]) => string);
  }
): BulkActionConfig<T> {
  return {
    id: 'maintenance',
    label: 'Set to Maintenance',
    icon: 'tool',
    color: 'secondary',
    confirm: true,
    confirmMessage: options?.confirmMessage || ((items: T[]) => 
      `Are you sure you want to set ${items.length} ${items.length === 1 ? entityName : entityNamePlural} to maintenance mode?`
    ),
    action: async (items: T[]) => {
      const ids = items.map((item: any) => item.id);
      await updateFunction(ids, 'maintenance');
    },
    requirePermission: options?.requirePermission,
  };
}

/**
 * Create a bulk delete action.
 * 
 * @param entityName - Entity name (singular) for messages
 * @param entityNamePlural - Entity name (plural) for messages
 * @param deleteFunction - Function to delete items in store
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createDeleteAction('contact', 'contacts',
 *   (ids) => store.bulkDelete(ids),
 *   { requirePermission: Permission.CONTACT_DELETE }
 * )
 */
export function createDeleteAction<T>(
  entityName: string,
  entityNamePlural: string,
  deleteFunction: (ids: string[]) => Promise<void>,
  options?: {
    requirePermission?: Permission;
    confirmMessage?: string | ((items: T[]) => string);
  }
): BulkActionConfig<T> {
  return {
    id: 'delete',
    label: 'Delete',
    icon: 'trash',
    color: 'error',
    confirm: true,
    confirmMessage: options?.confirmMessage || ((items: T[]) => 
      `Are you sure you want to delete ${items.length} ${items.length === 1 ? entityName : entityNamePlural}? This action cannot be undone.`
    ),
    action: async (items: T[]) => {
      const ids = items.map((item: any) => item.id);
      await deleteFunction(ids);
    },
    requirePermission: options?.requirePermission,
  };
}

/**
 * Create a bulk export action.
 * 
 * @param exportFunction - Function to export items
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createExportAction((items) => exportToCSV(items))
 */
export function createExportAction<T>(
  exportFunction: (items: T[]) => void | Promise<void>,
  options?: {
    label?: string;
    icon?: string;
    confirm?: boolean;
  }
): BulkActionConfig<T> {
  return {
    id: 'export',
    label: options?.label || 'Export CSV',
    icon: options?.icon || 'download',
    color: 'primary',
    confirm: options?.confirm || false,
    action: async (items: T[]) => {
      await exportFunction(items);
    },
  };
}

/**
 * Create a custom bulk action.
 * 
 * @param id - Unique action identifier
 * @param label - Action label
 * @param actionFunction - Function to execute
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createCustomAction('assign', 'Assign to User', 
 *   async (items) => { await assignToUser(items); },
 *   { 
 *     icon: 'user-plus', 
 *     color: 'primary',
 *     confirm: true,
 *     requirePermission: Permission.CONTACT_UPDATE
 *   }
 * )
 */
export function createCustomAction<T>(
  id: string,
  label: string,
  actionFunction: (items: T[], store?: any) => Promise<void>,
  options?: {
    icon?: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    confirm?: boolean;
    confirmMessage?: string | ((items: T[]) => string);
    requirePermission?: Permission;
  }
): BulkActionConfig<T> {
  return {
    id,
    label,
    icon: options?.icon,
    color: options?.color || 'primary',
    confirm: options?.confirm || false,
    confirmMessage: options?.confirmMessage,
    action: actionFunction,
    requirePermission: options?.requirePermission,
  };
}

/**
 * Create standard status update actions (activate, deactivate, maintenance).
 * 
 * @param entityName - Entity name (singular) for messages
 * @param entityNamePlural - Entity name (plural) for messages
 * @param updateFunction - Function to update status in store
 * @param options - Additional options
 * @returns Array of bulk action configurations
 * 
 * @example
 * createStandardStatusActions('contact', 'contacts',
 *   (ids, status) => store.bulkUpdateStatus(ids, status),
 *   { 
 *     requirePermission: Permission.CONTACT_UPDATE,
 *     includeMaintenance: true
 *   }
 * )
 */
export function createStandardStatusActions<T>(
  entityName: string,
  entityNamePlural: string,
  updateFunction: (ids: string[], status: string) => Promise<void>,
  options?: {
    requirePermission?: Permission;
    includeMaintenance?: boolean;
    includeActivate?: boolean;
    includeDeactivate?: boolean;
  }
): BulkActionConfig<T>[] {
  const actions: BulkActionConfig<T>[] = [];
  
  if (options?.includeActivate !== false) {
    actions.push(
      createActivateAction(entityName, entityNamePlural, updateFunction, {
        requirePermission: options?.requirePermission,
      })
    );
  }
  
  if (options?.includeDeactivate !== false) {
    actions.push(
      createDeactivateAction(entityName, entityNamePlural, updateFunction, {
        requirePermission: options?.requirePermission,
      })
    );
  }
  
  if (options?.includeMaintenance) {
    actions.push(
      createMaintenanceAction(entityName, entityNamePlural, updateFunction, {
        requirePermission: options?.requirePermission,
      })
    );
  }
  
  return actions;
}

/**
 * Create a bulk action for assigning items to a category or group.
 * 
 * @param categoryName - Name of the category (e.g., 'role', 'group')
 * @param categoryValue - Value to assign
 * @param updateFunction - Function to update category
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createAssignCategoryAction('role', 'admin',
 *   (ids, value) => store.bulkUpdateRole(ids, value),
 *   { 
 *     label: 'Set as Admin',
 *     requirePermission: Permission.USER_UPDATE
 *   }
 * )
 */
export function createAssignCategoryAction<T>(
  categoryName: string,
  categoryValue: string,
  updateFunction: (ids: string[], value: string) => Promise<void>,
  options?: {
    label?: string;
    icon?: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    confirm?: boolean;
    confirmMessage?: string | ((items: T[]) => string);
    requirePermission?: Permission;
  }
): BulkActionConfig<T> {
  return {
    id: `assign-${categoryName}-${categoryValue}`,
    label: options?.label || `Set ${categoryName} to ${categoryValue}`,
    icon: options?.icon || 'tag',
    color: options?.color || 'primary',
    confirm: options?.confirm !== false,
    confirmMessage: options?.confirmMessage || ((items: T[]) => 
      `Are you sure you want to set ${categoryName} to "${categoryValue}" for ${items.length} item(s)?`
    ),
    action: async (items: T[]) => {
      const ids = items.map((item: any) => item.id);
      await updateFunction(ids, categoryValue);
    },
    requirePermission: options?.requirePermission,
  };
}

/**
 * Create a bulk action for adding tags to items.
 * 
 * @param tag - Tag to add
 * @param addTagFunction - Function to add tag
 * @param options - Additional options
 * @returns Bulk action configuration
 * 
 * @example
 * createAddTagAction('important',
 *   (ids, tag) => store.bulkAddTag(ids, tag),
 *   { requirePermission: Permission.CONTACT_UPDATE }
 * )
 */
export function createAddTagAction<T>(
  tag: string,
  addTagFunction: (ids: string[], tag: string) => Promise<void>,
  options?: {
    label?: string;
    icon?: string;
    confirm?: boolean;
    requirePermission?: Permission;
  }
): BulkActionConfig<T> {
  return {
    id: `add-tag-${tag}`,
    label: options?.label || `Add "${tag}" tag`,
    icon: options?.icon || 'tag',
    color: 'primary',
    confirm: options?.confirm || false,
    action: async (items: T[]) => {
      const ids = items.map((item: any) => item.id);
      await addTagFunction(ids, tag);
    },
    requirePermission: options?.requirePermission,
  };
}

/**
 * Create common bulk actions for contact-like entities.
 * 
 * @param entityName - Entity name (singular)
 * @param entityNamePlural - Entity name (plural)
 * @param store - Store instance with bulk operations
 * @param options - Configuration options
 * @returns Array of bulk action configurations
 * 
 * @example
 * createContactBulkActions('contact', 'contacts', contactsStore, {
 *   includeExport: true,
 *   updatePermission: Permission.CONTACT_UPDATE
 * })
 */
export function createContactBulkActions<T>(
  entityName: string,
  entityNamePlural: string,
  store: {
    bulkUpdateStatus?: (ids: string[], status: string) => Promise<void>;
  },
  options?: {
    includeExport?: boolean;
    exportFunction?: (items: T[]) => void;
    updatePermission?: Permission;
  }
): BulkActionConfig<T>[] {
  const actions: BulkActionConfig<T>[] = [];
  
  if (store.bulkUpdateStatus) {
    actions.push(
      ...createStandardStatusActions(
        entityName,
        entityNamePlural,
        store.bulkUpdateStatus,
        { requirePermission: options?.updatePermission }
      )
    );
  }
  
  if (options?.includeExport && options?.exportFunction) {
    actions.push(createExportAction(options.exportFunction));
  }
  
  return actions;
}

/**
 * Create common bulk actions for user-like entities.
 * 
 * @param store - Store instance with bulk operations
 * @param options - Configuration options
 * @returns Array of bulk action configurations
 * 
 * @example
 * createUserBulkActions(usersStore, {
 *   updatePermission: Permission.USER_UPDATE,
 *   deletePermission: Permission.USER_DELETE
 * })
 */
export function createUserBulkActions<T>(
  store: {
    bulkUpdateStatus?: (ids: string[], status: string) => Promise<void>;
    bulkDelete?: (ids: string[]) => Promise<void>;
  },
  options?: {
    updatePermission?: Permission;
    deletePermission?: Permission;
  }
): BulkActionConfig<T>[] {
  const actions: BulkActionConfig<T>[] = [];
  
  if (store.bulkUpdateStatus) {
    actions.push(
      ...createStandardStatusActions('user', 'users', store.bulkUpdateStatus, {
        requirePermission: options?.updatePermission,
      })
    );
  }
  
  if (store.bulkDelete) {
    actions.push(
      createDeleteAction('user', 'users', store.bulkDelete, {
        requirePermission: options?.deletePermission,
      })
    );
  }
  
  return actions;
}

/**
 * Create common bulk actions for device/meter-like entities.
 * 
 * @param entityName - Entity name (singular)
 * @param entityNamePlural - Entity name (plural)
 * @param store - Store instance with bulk operations
 * @param options - Configuration options
 * @returns Array of bulk action configurations
 * 
 * @example
 * createDeviceBulkActions('meter', 'meters', metersStore, {
 *   includeMaintenance: true,
 *   updatePermission: Permission.METER_UPDATE
 * })
 */
export function createDeviceBulkActions<T>(
  entityName: string,
  entityNamePlural: string,
  store: {
    bulkUpdateStatus?: (ids: string[], status: string) => Promise<void>;
  },
  options?: {
    includeMaintenance?: boolean;
    updatePermission?: Permission;
  }
): BulkActionConfig<T>[] {
  const actions: BulkActionConfig<T>[] = [];
  
  if (store.bulkUpdateStatus) {
    actions.push(
      ...createStandardStatusActions(
        entityName,
        entityNamePlural,
        store.bulkUpdateStatus,
        {
          requirePermission: options?.updatePermission,
          includeMaintenance: options?.includeMaintenance !== false,
        }
      )
    );
  }
  
  return actions;
}
