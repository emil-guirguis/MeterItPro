/**
 * EntityManagementPage Component
 * 
 * Generic page component that handles the common pattern of:
 * - Displaying a list of entities
 * - Opening a form modal for create/edit
 * - Handling form submission
 * 
 * This eliminates the need for boilerplate management pages.
 * 
 * @example
 * ```tsx
 * export const ContactManagementPage = () => (
 *   <EntityManagementPage
 *     title="Contact Management"
 *     entityName="contact"
 *     ListComponent={ContactList}
 *     FormComponent={ContactForm}
 *     useStore={useContactsEnhanced}
 *   />
 * );
 * ```
 */

import React, { useState } from 'react';
import { FormModal } from './FormModal';
import type { ReactElement } from 'react';
import './EntityManagementPage.css';

export interface EntityManagementPageProps<TEntity, TStore> {
  /** Page title */
  title: string;
  /** Entity name for modal titles (e.g., "contact", "user") */
  entityName: string;
  /** List component to display entities */
  ListComponent: React.ComponentType<any>;
  /** Form component for create/edit */
  FormComponent: React.ComponentType<any>;
  /** Hook that returns the entity store */
  useStore: () => TStore & {
    createItem?: (data: any) => Promise<TEntity>;
    updateItem?: (id: string, data: any) => Promise<TEntity>;
    fetchItems?: () => Promise<void>;
    [key: string]: any;
  };
  /** Optional: Custom layout component (defaults to AppLayout) */
  LayoutComponent?: React.ComponentType<{ title: string; children: React.ReactNode }>;
  /** Optional: Custom modal component */
  ModalComponent?: React.ComponentType<any>;
  /** Optional: Additional props to pass to ListComponent */
  listProps?: Record<string, any>;
  /** Optional: Additional props to pass to FormComponent */
  formProps?: Record<string, any>;
  /** Optional: Callback after successful save */
  onSaveSuccess?: (entity: TEntity, mode: 'create' | 'update') => void;
  /** Optional: Callback on save error */
  onSaveError?: (error: Error, mode: 'create' | 'update') => void;
}

/**
 * Generic entity management page component
 * Handles list display, form modal, and CRUD operations
 */
export function EntityManagementPage<TEntity extends { id?: string | number }, TStore>({
  title,
  entityName,
  ListComponent,
  FormComponent,
  useStore,
  LayoutComponent,
  ModalComponent,
  listProps = {},
  formProps = {},
  onSaveSuccess,
  onSaveError,
}: EntityManagementPageProps<TEntity, TStore>): ReactElement {
  const store = useStore();
  const [editingEntity, setEditingEntity] = useState<TEntity | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSelect = (_entity: TEntity) => {
    setEditingEntity(null);
    setShowForm(false);
  };

  const handleEdit = (entity: TEntity) => {
    setEditingEntity(entity);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingEntity(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEntity(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const mode = editingEntity ? 'update' : 'create';
      let savedEntity: TEntity;

      if (editingEntity && editingEntity.id) {
        // Update existing entity
        if (!store.updateItem) {
          throw new Error('Store does not have updateItem method');
        }
        savedEntity = await store.updateItem(String(editingEntity.id), data);
      } else {
        // Create new entity
        if (!store.createItem) {
          throw new Error('Store does not have createItem method');
        }
        savedEntity = await store.createItem(data);
      }

      // Close form
      // Note: No need to call fetchItems() here because the store's createItem/updateItem
      // methods already handle optimistic updates to the list
      handleFormClose();

      // Call success callback
      if (onSaveSuccess) {
        onSaveSuccess(savedEntity, mode);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Error saving ${entityName}:`, err);

      // Call error callback
      if (onSaveError) {
        onSaveError(err, editingEntity ? 'update' : 'create');
      }

      throw err; // Re-throw so form can handle it
    }
  };

  // Use default components if not provided
  const Layout = LayoutComponent || DefaultLayout;

  // Create dynamic prop names based on entity name
  const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const listComponentProps = {
    [`on${capitalizedEntity}Select`]: handleSelect,
    [`on${capitalizedEntity}Edit`]: handleEdit,
    [`on${capitalizedEntity}Create`]: handleCreate,
    ...listProps,
  };

  const formComponentProps = {
    [entityName]: editingEntity || undefined,
    onCancel: handleFormClose,
    onSubmit: handleFormSubmit,
    ...formProps,
  };

  const ModalComponent_ = ModalComponent || FormModal;

  return (
    <Layout title={title}>
      <div className="entity-management-page">
        <ListComponent {...listComponentProps} />

        <ModalComponent_
          isOpen={showForm}
          title={capitalizedEntity}
          onClose={handleFormClose}
          showSaveButton={true}
          saveLabel="Save"
          size={formProps.modalSize || 'md'}
        >
          {showForm && (
            <FormComponent
              key={editingEntity?.id ? `edit-${editingEntity.id}` : 'new'}
              {...formComponentProps}
            />
          )}
        </ModalComponent_>
      </div>
    </Layout>
  );
}

// Default layout component (fallback)
const DefaultLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <title>{title}</title>
    {children}
  </div>
);

// Default modal component (fallback)
const DefaultModal: React.FC<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  showSaveButton?: boolean;
  saveLabel?: string;
  size?: string;
  [key: string]: any;
}> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};
