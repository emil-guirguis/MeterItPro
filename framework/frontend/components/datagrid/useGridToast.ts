import { useState } from 'react';

export interface GridToastProps {
  showToast: boolean;
  toastMessage: string;
  toastSeverity: 'success' | 'error';
  onToastClose: () => void;
}

export function useGridToast() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  const showSuccess = (message: string) => {
    setToastMessage(message);
    setToastSeverity('success');
    setShowToast(true);
  };

  const showError = (message: string) => {
    setToastMessage(message);
    setToastSeverity('error');
    setShowToast(true);
  };

  const toastProps: GridToastProps = {
    showToast,
    toastMessage,
    toastSeverity,
    onToastClose: () => setShowToast(false),
  };

  return { toastProps, showSuccess, showError };
}
