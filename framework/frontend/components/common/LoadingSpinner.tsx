import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 40,
  fullScreen = false,
}) => {
  return (
    <div
      className={`loading-spinner ${fullScreen ? 'loading-spinner--fullscreen' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{ '--spinner-size': `${size}px` } as React.CSSProperties}
    >
      <div className="loading-spinner__spinner" />
      {message && !fullScreen && (
        <p className="loading-spinner__message">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
