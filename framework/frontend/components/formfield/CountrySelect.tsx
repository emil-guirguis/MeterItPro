import React, { useState, useEffect } from 'react';
import './CountrySelect.css';

/**
 * @deprecated Use FormField with type="country" instead.
 * This component is maintained for backward compatibility.
 * The country selection logic is now integrated into FormField.
 */
interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'VE', name: 'Venezuela' },
];

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  placeholder = 'Select a country'
}) => {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (required && !value) {
      setIsValid(false);
      setErrorMessage('Country is required');
    } else if (value && !COUNTRIES.find(country => country.name === value || country.code === value)) {
      setIsValid(false);
      setErrorMessage('Please select a valid country');
    } else {
      setIsValid(true);
      setErrorMessage('');
    }
  }, [value, required]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  return (
    <div className="country-select-wrapper">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={`country-select ${className} ${!isValid ? 'country-select--error' : ''}`}
        title="Country"
        aria-label="Select country"
      >
        <option value="">{placeholder}</option>
        {COUNTRIES.map(country => (
          <option key={country.code} value={country.name}>
            {country.name}
          </option>
        ))}
      </select>
      {!isValid && errorMessage && (
        <span className="country-select-error">{errorMessage}</span>
      )}
    </div>
  );
};

export const validateCountry = (value: string, required: boolean = false): { isValid: boolean; message: string } => {
  if (required && !value) {
    return { isValid: false, message: 'Country is required' };
  }
  
  if (value && !COUNTRIES.find(country => country.name === value || country.code === value)) {
    return { isValid: false, message: 'Please select a valid country' };
  }
  
  return { isValid: true, message: '' };
};

export default CountrySelect;
