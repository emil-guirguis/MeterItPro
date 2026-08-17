/**
 * NotificationProvider Component
 * 
 * Provides a global notification system using MUI's Snackbar component.
 * Wraps the application to display success and error notifications.
 * 
 * Feature: meter-reading-export
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React, { createContext, useContext } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNotification } from '../hooks/useNotification';

/**
 * Notification context type
 */
interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

/**
 * Create the notification context
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Props for the NotificationProvider component
 */
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * NotificationProvider Component
 * 
 * Provides a global notification system for the application.
 * Wraps the application to display success and error notifications.
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const {
    notification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification,
  } = useNotification();

  const value: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Global Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

/**
 * Hook to use the notification context
 * 
 * @returns Notification context with showSuccess, showError, showWarning, showInfo functions
 * @throws Error if used outside of NotificationProvider
 */
export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
