import React from 'react';
import { EntityManagementPage } from '@framework/components/entity';
import { ContactList } from './ContactList';
import { ContactForm } from './ContactForm';
import type { Contact } from './types';

export const ContactManagementPage: React.FC = () => (
  <EntityManagementPage<Contact>
    title="Contact"
    moduleIcon="contacts"
    renderList={({ onEdit, onCreate }) => (
      <ContactList onContactEdit={onEdit} onContactCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => (
      <ContactForm contact={entity} onCancel={onCancel} />
    )}
  />
);
