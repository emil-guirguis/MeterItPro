import { createRoot } from 'react-dom/client';

import { ConfirmationModal } from '@framework/components/modal/';

export interface ConfirmationConfig {
  type?: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

export function showConfirmation(config: ConfirmationConfig): void {
  const {
    type = 'danger',
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm
  } = config;

  // Create modal container
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const cleanup = () => {
    root.unmount();
    document.body.removeChild(container);
  };

  const handleConfirm = async () => {
    cleanup();
    await onConfirm();
  };

  const handleCancel = () => {
    cleanup();
  };

  root.render(
    <ConfirmationModal
      isOpen={true}
      type={type}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
