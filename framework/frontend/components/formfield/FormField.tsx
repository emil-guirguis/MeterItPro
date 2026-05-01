import React, { forwardRef, useMemo } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  FormControlLabel,
  RadioGroup,
  Radio,
  InputAdornment,
  IconButton,
  Switch,
  Autocomplete,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { NumberSpinner } from './NumberSpinner';
import { URLLink } from './URLLink';
import { CronField } from './CronField';
import './FormField.css';

export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormFieldProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'url' | 'tel' | 'search' | 'file' | 'country' | 'cron' | 'timezone' | 'currency' | 'language';
  value?: any;
  error?: string;
  touched?: boolean;
  help?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  modified?: boolean;
  searchable?: boolean;
  options?: FormFieldOption[];
  rows?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent) => void;
  [key: string]: any;
}

/**
 * Reusable form field component with validation and error display
 * Supports Material Design 3 outlined styling via MUI components
 */
export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(
  ({
    name,
    label,
    type = 'text',
    value,
    error,
    touched,
    help,
    placeholder,
    required,
    disabled,
    modified,
    searchable,
    options,
    rows = 4,
    min,
    max,
    step,
    pattern,
    onChange,
    onBlur,
  }, ref) => {
    const showError = touched && error;
    const fieldId = `field-${name}`;
    const errorId = `${fieldId}-error`;

    // Debug logging
    React.useEffect(() => {
      const element = document.getElementById(fieldId);
      if (element) {
        const styles = window.getComputedStyle(element);
        console.log(`[FormField Debug] ${name}:`, {
          type,
          computedStyles: {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            borderWidth: styles.borderWidth,
            color: styles.color,
          },
          classList: element.className,
        });
      }
    }, [fieldId, name, type]);

    const handleNumberChange = (direction: 1 | -1) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
      const stepValue = typeof step === 'string' ? parseFloat(step) : (step ?? 1);
      let newValue = numValue + (stepValue * direction);

      const minValue = typeof min === 'string' ? parseFloat(min) : min;
      const maxValue = typeof max === 'string' ? parseFloat(max) : max;

      if (minValue !== undefined && newValue < minValue) {
        newValue = minValue;
      }
      if (maxValue !== undefined && newValue > maxValue) {
        newValue = maxValue;
      }

      const syntheticEvent = {
        target: {
          name,
          value: newValue.toString(),
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    };

    const renderInput = () => {
      switch (type) {
        case 'textarea':
          return (
            <TextField
              id={fieldId}
              name={name}
              label={label}
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              multiline
              rows={rows || 6}
              fullWidth
              variant="outlined"
              error={showError}
              helperText={showError ? error : help}
              placeholder={placeholder}
              data-field={name}
              data-component="textarea"
              {...(showError && { 'aria-invalid': true })}
              aria-describedby={showError ? errorId : undefined}
            />
          );

        case 'select':
        case 'timezone':
        case 'currency':
        case 'language': {
          if (searchable || type === 'timezone' || type === 'currency' || type === 'language') {
            const selectedOption = (options ?? []).find(o => String(o.value) === String(value ?? '')) ?? null;
            return (
              <Autocomplete
                id={fieldId}
                options={options ?? []}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
                isOptionEqualToValue={(opt, val) => String(opt.value) === String(val?.value ?? val)}
                value={selectedOption}
                onChange={(_e, newOpt) => {
                  onChange?.({ target: { name, value: newOpt?.value ?? '' } } as any);
                }}
                onBlur={onBlur}
                disabled={disabled}
                data-field={name}
                data-component="select-searchable"
                sx={{
                  '& .MuiOutlinedInput-root': { padding: '0 !important' },
                  '& .MuiAutocomplete-input': { padding: '8px 12px !important' },
                  '& .MuiAutocomplete-endAdornment': { right: '9px' },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={label}
                    required={required}
                    error={!!showError}
                    helperText={showError ? error : help}
                    placeholder={placeholder}
                  />
                )}
              />
            );
          }
          return (
            <FormControl fullWidth error={showError} disabled={disabled} variant="outlined" data-field={name} data-component="select">
              <InputLabel id={`${fieldId}-label`}>{label}</InputLabel>
              <Select
                labelId={`${fieldId}-label`}
                id={fieldId}
                name={name}
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
                label={label}
                required={required}
              >
                {placeholder && <MenuItem key="__placeholder__" value="">{placeholder}</MenuItem>}
                {options?.map((option: FormFieldOption, index: number) => (
                  <MenuItem key={`option-${index}-${option.value}`} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {showError && <FormHelperText id={errorId}>{error}</FormHelperText>}
              {!showError && help && <FormHelperText>{help}</FormHelperText>}
            </FormControl>
          );
        }

        case 'country':
          const countries = [
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
          return (
            <FormControl fullWidth error={showError} disabled={disabled} variant="outlined" data-field={name} data-component="country">
              <InputLabel id={`${fieldId}-label`}>{label}</InputLabel>
              <Select
                labelId={`${fieldId}-label`}
                id={fieldId}
                name={name}
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
                label={label}
                required={required}
              >
                {placeholder && <MenuItem key="__placeholder__" value="">{placeholder}</MenuItem>}
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.name}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
              {showError && <FormHelperText id={errorId}>{error}</FormHelperText>}
              {!showError && help && <FormHelperText>{help}</FormHelperText>}
            </FormControl>
          );

        case 'checkbox':
          return (
            <FormControlLabel
              data-field={name}
              data-component="checkbox"
              control={
                <Switch
                  id={fieldId}
                  name={name}
                  checked={!!value}
                  onChange={onChange}
                  onBlur={onBlur}
                  disabled={disabled}
                  {...(showError && { 'aria-invalid': true })}
                  aria-describedby={showError ? errorId : undefined}
                />
              }
              label={label}
            />
          );

        case 'radio':
          return (
            <FormControl error={showError} disabled={disabled} variant="outlined" data-field={name} data-component="radio">
              <InputLabel>{label}</InputLabel>
              <RadioGroup
                name={name}
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
              >
                {options?.map((option: FormFieldOption) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio disabled={option.disabled} />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
              {showError && <FormHelperText id={errorId}>{error}</FormHelperText>}
            </FormControl>
          );

        case 'email':
          return (
            <TextField
              id={fieldId}
              name={name}
              label={label}
              type="email"
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              fullWidth
              variant="outlined"
              error={showError}
              helperText={showError ? error : help}
              placeholder={placeholder}
              autoComplete="email"
              data-field={name}
              data-component="email"
              {...(showError && { 'aria-invalid': true })}
              aria-describedby={showError ? errorId : undefined}
              InputProps={{
                sx: value ? { color: '#1a73e8' } : {},
                endAdornment: value ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      tabIndex={-1}
                      title="Send email"
                      onClick={(e) => { e.stopPropagation(); window.open(`mailto:${value}`, '_self'); }}
                    >
                      <EmailOutlinedIcon fontSize="small" sx={{ color: '#1a73e8' }} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />
          );

        case 'url':
          return (
            <TextField
              id={fieldId}
              name={name}
              label={label}
              type="url"
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              fullWidth
              variant="outlined"
              error={showError}
              helperText={showError ? error : help}
              placeholder={placeholder}
              data-field={name}
              data-component="url"
              InputProps={{
                sx: value ? { color: '#1a73e8' } : {},
                endAdornment: value ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      tabIndex={-1}
                      title="Open URL"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <OpenInNewIcon fontSize="small" sx={{ color: '#1a73e8' }} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />
          );

        case 'tel':
        case 'phone': {
          // Format phone as US: (XXX) XXX-XXXX
          const formatPhoneValue = (input: string): string => {
            const digits = input.replace(/\D/g, '').slice(0, 10);
            if (digits.length === 0) return '';
            if (digits.length <= 3) return `(${digits}`;
            if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
          };

          const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatPhoneValue(e.target.value);
            const syntheticEvent = {
              target: {
                name,
                value: formatted,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          };

          return (
            <TextField
              id={fieldId}
              name={name}
              label={label}
              value={value ?? ''}
              onChange={handlePhoneChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              fullWidth
              variant="outlined"
              error={showError}
              helperText={showError ? error : help}
              placeholder={placeholder || '() -'}
              type="tel"
              inputProps={{ maxLength: 14 }}
              data-field={name}
              data-component="tel"
              {...(showError && { 'aria-invalid': true })}
              aria-describedby={showError ? errorId : undefined}
            />
          );
        }

        case 'date':
        case 'time':
        case 'datetime': {
          // Format datetime/date values - use useMemo to ensure proper formatting
          const displayValue = useMemo(() => {
            if (!value) return '';
            const strValue = String(value);

            if (type === 'datetime') {
              // Always parse and format datetime as "YYYY-MM-DD HH:mm"
              try {
                const date = new Date(strValue);
                if (isNaN(date.getTime())) return strValue; // Invalid date
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}`;
              } catch (e) {
                return strValue; // Return original if parse fails
              }
            } else if (type === 'date') {
              // For date fields, keep first 10 characters (YYYY-MM-DD)
              return strValue.slice(0, 10);
            }
            return strValue;
          }, [value, type]);

          return (
            <TextField
              id={fieldId}
              name={name}
              label={label}
              type={type === 'datetime' ? 'text' : type}
              value={displayValue}
              onChange={onChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              fullWidth
              variant="outlined"
              error={showError}
              helperText={showError ? error : help}
              placeholder={placeholder}
              InputLabelProps={{
                shrink: true,
              }}
              data-field={name}
              data-component={type}
              {...(showError && { 'aria-invalid': true })}
              aria-describedby={showError ? errorId : undefined}
            />
          );
        }

        case 'cron':
          return (
            <div data-field={name} data-component="cron">
              <CronField
                name={name}
                label={label}
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                error={error}
                touched={touched}
                help={help}
                required={required}
              />
            </div>
          );

        default: {
          const isNumberField = type === 'number';
          return (
            <TextField
              id={fieldId}
              name={name}
              label={label}
              type={isNumberField ? 'number' : type}
              value={value ?? ''}
              onChange={onChange}
              onBlur={onBlur}
              required={required}
              disabled={disabled}
              fullWidth
              variant="outlined"
              error={showError}
              helperText={showError ? error : help}
              placeholder={placeholder}
              autoComplete="off"
              data-field={name}
              data-component={type}
              InputProps={
                isNumberField ? {
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: -1 }}>
                      <NumberSpinner
                        value={value ?? ''}
                        min={typeof min === 'string' ? parseFloat(min) : min}
                        max={typeof max === 'string' ? parseFloat(max) : max}
                        step={typeof step === 'string' ? parseFloat(step) : step}
                        onIncrement={() => handleNumberChange(1)}
                        onDecrement={() => handleNumberChange(-1)}
                        disabled={disabled}
                      />
                    </InputAdornment>
                  ),
                  min,
                  max,
                  step,
                  pattern,
                } : {
                  min,
                  max,
                  step,
                  pattern,
                }
              }
              {...(showError && { 'aria-invalid': true })}
              aria-describedby={showError ? errorId : undefined}
              ref={ref}
              sx={isNumberField ? {
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
              } : undefined}
            />
          );
        }
      }
    };

  const cls = `form-field-root${modified ? ' form-field-root--modified' : ''}`;
  return <div className={cls}>{renderInput()}</div>;
});

FormField.displayName = 'FormField';
