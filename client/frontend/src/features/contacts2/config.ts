/**
 * Contact Configuration
 * 
 * Centralized configuration for Contact entity including:
 * - Stats, bulk actions, and export configuration
 * 
 * Schema is loaded dynamically from the backend via useSchema('contact')
 * List columns and filters are auto-generated from the schema.
 */

import type { StatDefinition, BulkActionConfig, ExportConfig } from '@framework/components/list/types/list';
import { Permission } from '../../types/auth';
import {
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';
import type { Contact } from './types';

// ============================================================================
// STATS DEFINITIONS
// ============================================================================

/**
 * Stats definitions for contact list
 */
export const contactStats: StatDefinition<Contact>[] = [
  {
    label: 'Active Contacts',
    value: (items: Contact[]) => Array.isArray(items) ? items.filter((c: Contact) => c.active).length : 0,
  },
  {
    label: 'Inactive Contacts',
    value: (items: Contact[]) => Array.isArray(items) ? items.filter((c: Contact) => !c.active).length : 0,
  },
];

// ============================================================================
// BULK ACTIONS
// ============================================================================

/**
 * Bulk action configurations for contact list
 */
export function createContactBulkActions(
  store: { bulkUpdateStatus: (ids: string[], status: string) => Promise<void> },
  exportFunction: (items: Contact[]) => void
): BulkActionConfig<Contact>[] {
  return [
    ...createStandardStatusActions<Contact>(
      'contact',
      'contacts',
      store.bulkUpdateStatus,
      { requirePermission: Permission.CONTACT_UPDATE }
    ),
    createExportAction<Contact>(exportFunction),
  ];
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Export configuration for contact list
 */
export const contactExportConfig: ExportConfig<Contact> = {
  filename: (date: string) => `contacts_export_${date}.csv`,
  headers: [
    'Name',
    'Company',
    'Role',
    'Email',
    'Phone',
    'Active',
    'Street',
    'City',
    'State',
    'Zip Code',
    'Country',
    'Notes',
    'Created',
  ],
  mapRow: (contact: Contact) => [
    contact.name,
    contact.company || '',
    contact.role || '',
    contact.email,
    contact.phone,
    contact.active ? 'Yes' : 'No',
    contact.street || '',
    contact.city || '',
    contact.state || '',
    contact.zip || '',
    contact.country || '',
    contact.notes || '',
    contact.created_at ? new Date(contact.created_at).toISOString() : '',
  ],
  includeInfo: 'Contact export with full details including address and contact information',
};
