/**
 * useNotification Hook
 * 
 * Provides a simple interface for displaying success and error notifications
 * using MUI's Snackbar component.
 * 
 * Feature: meter-reading-export
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState, useCallback } from 'react';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  message: string;
  severity: NotificationSeverity;
  open: boolean;
}

/**
 * Hook for managing notifications
 * 
 * Returns an object with:
 * - notification: Current notification state
 * - showSuccess: Function to show success notification
 * - showError: Function to show error notification
 * - showWarning: Function to show warning notification
 * - showInfo: Function to show info notification
 * - closeNotification: Function to close notification
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function useNotification() {
  const [notification, setNotification] = useState<Notification>({
    message: '',
    severity: 'info',
    open: false,
  });

  /**
   * Show a notification with the specified severity
   */
  const showNotification = useCallback(
    (message: string, severity: NotificationSeverity = 'info') => {
      setNotification({
        message,
        severity,
        open: true,
      });
    },
    []
  );

  /**
   * Show a success notification
   */
  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  /**
   * Show an error notification
   */
  const showError = useCallback((message: string) => {
    showNotification(message, 'error');
  }, [showNotification]);

  /**
   * Show a warning notification
   */
  const showWarning = useCallback((message: string) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  /**
   * Show an info notification
   */
  const showInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  /**
   * Close the notification
   */
  const closeNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      open: false,
    }));
  }, []);

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification,
  };
}
