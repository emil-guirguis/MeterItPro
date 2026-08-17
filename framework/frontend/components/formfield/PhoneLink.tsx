import React from 'react';
import './PhoneLink.css';

export interface PhoneLinkProps {
  value: string;
  disabled?: boolean;
  className?: string;
  onChange?: (newValue: string) => void;
}

/**
 * Phone link component that displays as an editable text input
 * Applies phone mask formatting and becomes a clickable tel link when valid
 */
export const PhoneLink: React.FC<PhoneLinkProps> = ({
  value,
  disabled = false,
  className = '',
  onChange,
}) => {
  // Format phone number with mask: (XXX) XXX-XXXX
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Check if phone number is valid (at least 10 digits)
  const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const formattedPhone = formatPhoneNumber(value);
  const isValid = isValidPhone(value);
  const telHref = `tel:${value.replace(/\D/g, '')}`;

  // Always render as editable input, but style as link when valid
  return (
    <div className="phone-link__wrapper">
      <input
        type="tel"
        value={formattedPhone || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`phone-link__input ${isValid ? 'phone-link__input--valid' : ''} ${className}`}
        placeholder="Enter phone number"
        aria-label="Phone number"
      />
      {isValid && value && value.trim() !== '' && (
        <a
          href={telHref}
          className={`phone-link__link ${disabled ? 'phone-link--disabled' : ''}`}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
            }
          }}
          title={`Call ${formattedPhone}`}
          aria-label={`Phone number: ${formattedPhone}`}
          tabIndex={-1}
        >
          {formattedPhone}
        </a>
      )}
    </div>
  );
};
