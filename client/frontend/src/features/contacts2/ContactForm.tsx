/**
 * Contact Form
 * 
 * Uses the dynamic schema-based BaseForm to render the contact form.
 * All validation, field rendering, and form management is handled by BaseForm.
 */

import React from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useContactsEnhanced } from './contactsStore';
import type { Contact } from './types';
import './ContactForm.css';

interface ContactFormProps {
  contact?: Contact;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const contacts = useContactsEnhanced();

  return (
    <BaseForm
      schemaName="contact"
      entity={contact}
      store={contacts}
      onCancel={onCancel}
      onSubmit={onSubmit}
      className="contact-form"
      loading={loading}
    />
  );
};

export default ContactForm;
