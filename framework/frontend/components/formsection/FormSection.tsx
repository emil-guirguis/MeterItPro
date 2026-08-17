import React from 'react';
import './FormSection.css';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Form section component for grouping related fields
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`form-section ${className}`}>
      <div className="form-section__header">
        <h3 className="form-section__title">{title}</h3>
        {description && (
          <p className="form-section__description">{description}</p>
        )}
      </div>
      <div className="form-section__content">
        {children}
      </div>
    </div>
  );
};
