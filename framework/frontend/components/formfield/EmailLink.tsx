import React from 'react';
import './EmailLink.css';

export interface EmailLinkProps {
  value: string;
  disabled?: boolean;
  className?: string;
  onChange?: (newValue: string) => void;
}

/**
 * Email link component that displays as an editable text input
 * Becomes a clickable mailto link when valid email is entered
 */
export const EmailLink: React.FC<EmailLinkProps> = ({
  value,
  disabled = false,
  className = '',
  onChange,
}) => {
  // Check if email is valid
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValid = isValidEmail(value);
  const mailtoHref = `mailto:${value}`;

  // Always render as editable input, but style as link when valid
  return (
    <div className="email-link__wrapper">
      <input
        type="email"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`email-link__input ${isValid ? 'email-link__input--valid' : ''} ${className}`}
        placeholder="Enter email address"
        aria-label="Email address"
      />
      {isValid && value && value.trim() !== '' && (
        <a
          href={mailtoHref}
          className={`email-link__link ${disabled ? 'email-link--disabled' : ''}`}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
            }
          }}
          title={`Send email to ${value}`}
          aria-label={`Email: ${value}`}
          tabIndex={-1}
        >
          {value}
        </a>
      )}
    </div>
  );
};
