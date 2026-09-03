import React, { useState, useCallback } from 'react';
import { FormModal } from '../modal/FormModal';

export interface EntityManagementPageProps<T = any> {
  title: string;
  moduleIcon?: string;
  modalSize?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Overrides the auto-generated "Edit {title}" crumb. Pass a string for a
   * static label, or a function to derive it from the entity being edited
   * (e.g. show the record's name in the header).
   */
  editLabel?: string | ((entity: T) => string);
  /** Overrides auto-generated "New {title}" crumb */
  newLabel?: string;
  saveLabel?: string;
  showSaveButton?: boolean;
  /**
   * Render the list. Receives onEdit and onCreate callbacks.
   * Wire these to your list component's edit/create props.
   */
  renderList: (props: { onEdit: (entity: T) => void; onCreate: () => void }) => React.ReactNode;
  /**
   * Render the form inside the modal.
   * Called only while the modal is open.
   * Use entity === undefined to detect "new" mode.
   */
  renderForm: (props: { entity: T | undefined; onCancel: () => void; isNew: boolean }) => React.ReactNode;
}

/**
 * Generic list + modal-form page.
 *
 * Encapsulates the select/create/close state and FormModal wiring
 * that was duplicated across every *ManagementPage component.
 *
 * @example
 * ```tsx
 * export const ContactManagementPage = () => (
 *   <EntityManagementPage<Contact>
 *     title="Contact"
 *     moduleIcon="contacts"
 *     renderList={({ onEdit, onCreate }) => (
 *       <ContactList onContactEdit={onEdit} onContactCreate={onCreate} />
 *     )}
 *     renderForm={({ entity, onCancel }) => (
 *       <ContactForm contact={entity} onCancel={onCancel} />
 *     )}
 *   />
 * );
 * ```
 */
export function EntityManagementPage<T = any>({
  title,
  moduleIcon,
  modalSize = 'md',
  editLabel,
  newLabel,
  saveLabel = 'Save',
  showSaveButton = true,
  renderList,
  renderForm,
}: EntityManagementPageProps<T>) {
  const [selected, setSelected] = useState<T | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleEdit = useCallback((entity: T) => {
    setSelected(entity);
    setShowForm(true);
    setFormKey(k => k + 1);
  }, []);

  const handleCreate = useCallback(() => {
    setSelected(null);
    setShowForm(true);
    setFormKey(k => k + 1);
  }, []);

  const handleClose = useCallback(() => {
    setShowForm(false);
    setSelected(null);
  }, []);

  const crumb = selected !== null
    ? (typeof editLabel === 'function'
        ? editLabel(selected)
        : (editLabel ?? `Edit ${title}`))
    : (newLabel ?? `New ${title}`);

  return (
    <div className="entity-management-page">
      {renderList({ onEdit: handleEdit, onCreate: handleCreate })}

      <FormModal
        isOpen={showForm}
        title={title}
        moduleIcon={moduleIcon}
        crumb={crumb}
        onClose={handleClose}
        showSaveButton={showSaveButton}
        saveLabel={saveLabel}
        size={modalSize}
      >
        {showForm && (
          <React.Fragment key={formKey}>
            {renderForm({
              entity: selected ?? undefined,
              onCancel: handleClose,
              isNew: selected === null,
            })}
          </React.Fragment>
        )}
      </FormModal>
    </div>
  );
}
