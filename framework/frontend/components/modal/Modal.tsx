import React, { useEffect } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  loading?: boolean;
  error?: string;
  footer?: React.ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  showSaveButton?: boolean;
}

/**
 * Modal dialog component
 * 
 * A reusable modal dialog with responsive behavior and accessibility features.
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={showModal}
 *   title="Edit Item"
 *   onClose={() => setShowModal(false)}
 *   size="md"
 * >
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  size = 'md',
  fullScreen = false,
  loading = false,
  error,
  footer,
  onSave,
  saveLabel = 'Save',
  showSaveButton = false,
}) => {
  // Debug: log modal props to help track missing Save button issues in the app
  React.useEffect(() => {
    console.log('[Modal] render:', { title, isOpen, showSaveButton, hasOnSave: !!onSave, loading });
  }, [title, isOpen, showSaveButton, onSave, loading]);
  const { isMobile } = useResponsive();

  // Auto full screen on mobile
  const shouldFullScreen = fullScreen || isMobile;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Default save handler when none is provided:
  // Submit the last form on the page (most recently added), same behavior as FormModal.
  const handleDefaultSave = () => {
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      const form = forms[forms.length - 1] as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  return (
    <div 
      className={`
        modal__backdrop
        ${shouldFullScreen ? 'modal__backdrop--fullscreen' : ''}
      `.trim()}
    >
      <div 
        className={`
          modal
          modal--${size}
          ${shouldFullScreen ? 'modal--fullscreen' : ''}
          ${loading ? 'modal--loading' : ''}
        `.trim()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <div className="modal__header-actions">
            {showSaveButton && (
              <button
                type="button"
                className="modal__save-btn"
                onClick={onSave ?? handleDefaultSave}
                disabled={loading}
              >
                {saveLabel}
              </button>
            )}
            <button
              type="button"
              className="modal__close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="modal__error">
            <span className="modal__error-icon">⚠️</span>
            <span className="modal__error-message">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="modal__content">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal__footer">
            {footer}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="modal__loading-overlay">
            <div className="modal__loading-content">
              <div className="modal__spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
