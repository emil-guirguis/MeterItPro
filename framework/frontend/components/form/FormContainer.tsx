import React from 'react';
import './FormContainer.css';

export interface FormContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FormContainer Component
 * 
 * Provides the main container layout for forms with tabs.
 * Handles the overall structure and spacing to minimize whitespace.
 * 
 * @example
 * ```tsx
 * <FormContainer>
 *   <FormTabs ... />
 *   <div className="form-container__content">
 *     <BaseForm ... />
 *   </div>
 * </FormContainer>
 * ```
 */
export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`form-container ${className}`}>
      {children}
    </div>
  );
};

export default FormContainer;