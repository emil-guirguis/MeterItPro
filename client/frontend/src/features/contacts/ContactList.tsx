import React, { useMemo } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useContactsEnhanced } from './contactsStore';
import { useBaseList } from '@framework/components/list/hooks/useBaseList';
import { useAuth } from '../../hooks/useAuth';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { Contact } from './types';
import { Permission } from '../../types/auth';
import {
  contactStats,
  contactExportConfig,
} from './config';
import { showConfirmation } from '@framework/utils/confirmationHelper';
import './ContactList.css';

interface ContactListProps {
  onContactSelect?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactCreate?: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onContactSelect,
  onContactEdit,
  onContactCreate,
}) => {
  const contacts = useContactsEnhanced();
  const auth = useAuth();
  const { schema, loading: schemaLoading } = useSchema('contact');

  // Generate columns and filters from schema
  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<Contact>(schema.formFields, {
      fieldOrder: ['name', 'company', 'role', 'phone',  'active'],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  const filters = useMemo(() => {
    if (!schema) return [];
    // Generate filters from schema, but exclude 'name' and 'company' since they're
    // already covered by the AI search field (which searches name, email, company)
    return generateFiltersFromSchema(schema.formFields)
      .filter(f => !['name', 'company'].includes(f.key));
  }, [schema]);

  const handleContactDelete = (contact: Contact) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Contact',
      message: `Delete contact "${contact.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await contacts.deleteItem(String(contact.contact_id));
        await contacts.fetchItems();
      }
    });
  };

  const baseList = useBaseList<Contact, any>({
    entityName: 'contact',
    entityNamePlural: 'contacts',
    useStore: useContactsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.CONTACT_CREATE,
      update: Permission.CONTACT_UPDATE,
      delete: Permission.CONTACT_DELETE,
    },
    columns,
    filters,
    stats: contactStats,
    // bulkActions: createContactBulkActions(
    //   { bulkUpdateStatus: bulkUpdateStatusWrapper },
    //   (items) => baseList.handleExport(items)
    // ),
    export: contactExportConfig,
    onEdit: onContactEdit,
    onCreate: onContactCreate,
    authContext: auth,
  });

  const safeData = Array.isArray(baseList.data) ? baseList.data : [];

  if (schemaLoading) {
    return (
      <div className="contact-list">
        <div className="loading-message">Loading contact schema...</div>
      </div>
    );
  }

  return (
    <div className="contact-list">
      <BaseList
        title="Contacts"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        onExportClick={baseList.canExport ? () => baseList.handleExport(safeData) : undefined}
        data={safeData}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No contacts found. Create your first contact to get started."
        onEdit={baseList.handleEdit}
        onDelete={handleContactDelete}
        onSelect={baseList.bulkActions.length > 0 && onContactSelect ? (items) => onContactSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
