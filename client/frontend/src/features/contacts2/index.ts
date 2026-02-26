/**
 * Contacts Feature - Barrel Export
 * 
 * All contacts-related exports in one place
 */

export { ContactForm } from './ContactForm';
export { ContactList } from './ContactList';
export { ContactManagementPage } from './ContactManagementPage';
export { useContactsEnhanced, useContacts, useContactsStore } from './contactsStore';
export type { Contact } from './types';
export {
  contactStats,
  createContactBulkActions,
  contactExportConfig,
} from './config';
