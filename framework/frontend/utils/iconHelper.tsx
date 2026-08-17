/**
 * Icon Helper Utility
 * 
 * Centralized icon rendering using Google Material Icons.
 * 
 * @example
 * ```tsx
 * import { getIconElement, MaterialIcons } from '@framework/shared/utils';
 * 
 * {getIconElement('add')}
 * {getIconElement(MaterialIcons.DELETE, 'icon-danger')}
 * ```
 */

import React from 'react';

/**
 * Material Icons constants for type-safe icon usage
 * Framework provides common UI icons only
 */
export const MaterialIcons = {
  // Common UI - Navigation
  DASHBOARD: 'dashboard',
  // Actions
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  SAVE: 'save',
  CANCEL: 'close',
  SEARCH: 'search',
  FILTER: 'filter_list',
  REFRESH: 'refresh',
  MORE: 'more_vert',
  // Navigation
  MENU: 'menu',
  ARROW_BACK: 'arrow_back',
  ARROW_FORWARD: 'arrow_forward',
  EXPAND_MORE: 'expand_more',
  EXPAND_LESS: 'expand_less',
  // Files
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  TABLE_CHART: 'table_chart',
  FOLDER: 'folder',
  // Communication
  EMAIL: 'email',
  PHONE: 'phone',
  NOTIFICATIONS: 'notifications',
  CONTACT: 'contacts_product',
  DEVICE: 'shelves',
  EMAIL_TEMPLATE: 'mark_as_unread',
  // Status
  CHECK: 'check',
  CHECK_CIRCLE: 'check_circle',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  // User
  PERSON: 'person',
  PEOPLE: 'people',
  ACCOUNT_CIRCLE: 'account_circle',
  VISIBILITY: 'visibility',
  VISIBILITY_OFF: 'visibility_off',
  LOCK: 'lock',
  // Other
  HOME: 'home',
  CALENDAR: 'calendar_today',
  STAR: 'star',
  HELP: 'help',
  SETTINGS: 'settings'
} as const;

/**
 * Icon mapping for framework UI elements
 * Applications can extend this with their own mappings
 */
let iconMap: Record<string, string> = {
  // Create lowercase mappings from MaterialIcons
  ...Object.fromEntries(
    Object.entries(MaterialIcons).map(([key, value]) => [key.toLowerCase(), value])
  ),
};

/**
 * Register custom icon mappings for application-specific icons
 * Call this once during app initialization
 * 
 * @example
 * ```tsx
 * registerIconMappings({
 *   'meters': 'electric_bolt',
 *   'devices': 'devices',
 *   'management': 'settings'
 * });
 * ```
 */
export function registerIconMappings(customMappings: Record<string, string>): void {
  iconMap = { ...iconMap, ...customMappings };
}

/**
 * Render a Material Icon element
 * 
 * @param iconName - Material icon name or menu item ID (e.g., 'add', 'delete', 'meters')
 * @param className - Optional CSS classes
 * @returns React element for the icon
 */
export function getIconElement(
  iconName: string,
  className?: string
): React.ReactElement {
  // Map menu item IDs to Material Icon names
  const materialIconName = iconMap[iconName] || iconName;
  
  return (
    <span
      className={`material-symbols-outlined ${className || ''}`.trim()}
      aria-hidden="true"
    >
      {materialIconName}
    </span>
  );
}


