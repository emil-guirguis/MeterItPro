import React from 'react';
import './FormActions.css';

export interface FormActionsProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  showCancel?: boolean;
  className?: string;
  submitButtonClassName?: string;
  cancelButtonClassName?: string;
}

/**
 * Form actions component for submit and cancel buttons
 */
export const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  isDisabled = false,
  showCancel = true,
  className = '',
  submitButtonClassName = '',
  cancelButtonClassName = '',
}) => {
  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onSubmit && !isSubmitting && !isDisabled) {
      onSubmit();
    }
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onCancel && !isSubmitting) {
      onCancel();
    }
  };

  return (
    <div className={`form-actions ${className}`}>
      {showCancel && onCancel && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className={`form-actions__btn form-actions__btn--secondary ${cancelButtonClassName}`}
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isSubmitting || isDisabled}
        className={`form-actions__btn form-actions__btn--primary ${submitButtonClassName}`}
      >
        {isSubmitting ? (
          <>
            <span className="form-actions__spinner" />
            <span>Submitting...</span>
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
};
