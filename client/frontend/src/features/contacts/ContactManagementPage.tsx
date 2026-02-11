import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { ContactList } from './ContactList';
import { ContactForm } from './ContactForm';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { Contact } from './types';

export const ContactManagementPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedContact(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedContact(null);
  };

  return (
    <AppLayoutWrapper title="Contact Management">
      <div className="entity-management-page">
        <ContactList
          onContactEdit={handleEdit}
          onContactCreate={handleCreate}
        />

        <FormModal
          isOpen={showForm}
          title="Contact"
          onClose={handleFormClose}
          showSaveButton={true}
          saveLabel="Save"
          size="md"
        >
          {showForm && (
            <ContactForm
              key={selectedContact?.contact_id ? `edit-${selectedContact.contact_id}` : 'new'}
              contact={selectedContact || undefined}
              onCancel={handleFormClose}
            />
          )}
        </FormModal>
      </div>
    </AppLayoutWrapper>
  );
};
