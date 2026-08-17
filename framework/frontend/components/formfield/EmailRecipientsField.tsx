import React, { useState } from 'react';
import { Button, TextField } from '@mui/material';
import { FormField } from './FormField';
import './EmailRecipientsField.css';

export interface EmailFieldValue {
  from?: string | null;
  to: string[];
}

export interface EmailRecipientsFieldProps {
  value: EmailFieldValue;
  error?: string;
  disabled?: boolean;
  onChange: (value: EmailFieldValue) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmailRecipientsField: React.FC<EmailRecipientsFieldProps> = ({
  value,
  error,
  disabled,
  onChange,
}) => {
  const from = value?.from ?? '';
  const to = value?.to ?? [];

  const [toInput, setToInput] = useState('');
  const [toInputError, setToInputError] = useState('');

  const setFrom = (v: string) => onChange({ ...value, from: v || null });

  const addTo = () => {
    const email = toInput.trim();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) { setToInputError('Invalid email format'); return; }
    if (to.includes(email)) { setToInputError('Already added'); return; }
    onChange({ ...value, to: [...to, email] });
    setToInput('');
    setToInputError('');
  };

  const removeTo = (email: string) => onChange({ ...value, to: to.filter(e => e !== email) });

  return (
    <div className="email-recipients-field">
      {/* From */}
      <div className="email-recipients-field__from">
        <FormField
          name="from-email"
          type="email"
          label="From Email"
          value={from}
          placeholder="noreply@yourdomain.com (leave blank for system default)"
          disabled={disabled}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      {/* To */}
      <div className="email-recipients-field__to-label">To Recipients</div>
      <div className="email-recipients-field__input-row">
        <div className="email-recipients-field__input">
          <FormField
            name="to-email-input"
            type="email"
            value={toInput}
            error={toInputError}
            touched={!!toInputError}
            placeholder="Enter email address"
            disabled={disabled}
            onChange={(e) => { setToInput(e.target.value); if (toInputError) setToInputError(''); }}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addTo(); } }}
          />
        </div>
        <Button
          type="button"
          variant="outlined"
          onClick={addTo}
          disabled={disabled || !toInput.trim()}
          sx={{ flexShrink: 0, height: '56px' }}
        >
          Add
        </Button>
      </div>

      {to.length > 0 && (
        <div className="email-recipients-field__list">
          {to.map((email, i) => (
            <div key={i} className="email-recipients-field__tag">
              <span>{email}</span>
              <button
                type="button"
                className="email-recipients-field__remove"
                onClick={() => removeTo(email)}
                disabled={disabled}
                aria-label={`Remove ${email}`}
              >×</button>
            </div>
          ))}
        </div>
      )}
      {error && <span className="email-recipients-field__error">{error}</span>}
    </div>
  );
};

export default EmailRecipientsField;
