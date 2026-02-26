import React, { useState } from 'react';
import { Button } from '@mui/material';
import { FormField } from '@framework/components/formfield/FormField';
import './RecipientsField.css';

interface RecipientsFieldProps {
  value: string[];
  error?: string;
  isDisabled: boolean;
  onChange: (value: string[]) => void;
}

/**
 * RecipientsField Component
 * 
 * Custom field renderer for managing email recipients in reports.
 * Provides email validation, duplicate prevention, and add/remove UI.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */
export const RecipientsField: React.FC<RecipientsFieldProps> = ({
  value = [],
  error,
  isDisabled,
  onChange,
}) => {
  const [recipientInput, setRecipientInput] = useState('');
  const [inputError, setInputError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (!email) return;

    // Email validation
    if (!validateEmail(email)) {
      setInputError('Invalid email format');
      return;
    }

    if (value.includes(email)) {
      setInputError('Email already added');
      return;
    }

    onChange([...value, email]);
    setRecipientInput('');
    setInputError('');
  };

  const handleRemoveRecipient = (email: string) => {
    onChange(value.filter(r => r !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  return (
    <div className="recipients-field">
      <div className="recipients-input-group">
        <div className="recipients-input-group__field">
          <FormField
            name="recipient-input"
            type="email"
            value={recipientInput}
            error={inputError}
            touched={!!inputError}
            placeholder="Enter email address"
            disabled={isDisabled}
            onChange={(e) => {
              setRecipientInput(e.target.value);
              if (inputError) setInputError('');
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          type="button"
          variant="outlined"
          onClick={handleAddRecipient}
          disabled={isDisabled || !recipientInput.trim()}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap', height: '56px' }}
        >
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <div className="recipients-list">
          {value.map((email, idx) => (
            <div key={idx} className="recipient-tag">
              <span>{email}</span>
              <button
                type="button"
                className="recipient-tag__remove"
                onClick={() => handleRemoveRecipient(email)}
                disabled={isDisabled}
                aria-label={`Remove ${email}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default RecipientsField;
