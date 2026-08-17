import React, { useEffect } from 'react';
import './Toast.css';

export interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onClose?: () => void;
  duration?: number;
}

/**
 * Toast notification component
 * 
 * Displays a temporary notification message that auto-dismisses after a duration.
 * 
 * @example
 * ```tsx
 * <Toast 
 *   message="Operation successful!" 
 *   type="success" 
 *   onClose={() => setShowToast(false)}
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  onClose,
  duration = 10000 
}) => {
  useEffect(() => {
    if (onClose && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <span className="toast__message">{message}</span>
      {onClose && (
        <button 
          className="toast__close" 
          onClick={onClose} 
          aria-label="Close notification"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Toast;
