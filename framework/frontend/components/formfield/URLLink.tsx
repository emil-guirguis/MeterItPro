import React, { useState } from 'react';
import './URLLink.css';

export interface URLLinkProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: React.FocusEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * URL link component that displays URL as a clickable link in read mode
 * and switches to input mode when clicked
 */
export const URLLink: React.FC<URLLinkProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = 'Enter URL',
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(!value);

  const getUrlWithProtocol = (url: string): string => {
    if (!url) return '';
    if (url.match(/^https?:\/\//)) {
      return url;
    }
    return `https://${url}`;
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const urlWithProtocol = getUrlWithProtocol(value);
    window.open(urlWithProtocol, '_blank');
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(false);
    onBlur?.(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  if (isEditing || !value) {
    return (
      <input
        type="url"
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`url-link__input ${className}`}
        autoComplete="off"
      />
    );
  }

  return (
    <a
      href={getUrlWithProtocol(value)}
      onClick={handleLinkClick}
      className={`url-link ${className}`}
      title={`Open ${value}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {value}
    </a>
  );
};
