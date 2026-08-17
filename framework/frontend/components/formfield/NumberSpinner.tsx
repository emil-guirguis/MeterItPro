import React from 'react';
import './NumberSpinner.css';

export interface NumberSpinnerProps {
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Number spinner component with up/down arrow buttons
 */
export const NumberSpinner: React.FC<NumberSpinnerProps> = ({
  value,
  min,
  max,
  onIncrement,
  onDecrement,
  disabled = false,
  className = '',
}) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isAtMax = max !== undefined && numValue >= max;
  const isAtMin = min !== undefined && numValue <= min;

  return (
    <div className={`number-spinner ${className}`}>
      <button
        type="button"
        className="number-spinner__button number-spinner__button--up"
        onClick={onIncrement}
        disabled={disabled || isAtMax}
        aria-label="Increment value"
        title="Increment"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
      <button
        type="button"
        className="number-spinner__button number-spinner__button--down"
        onClick={onDecrement}
        disabled={disabled || isAtMin}
        aria-label="Decrement value"
        title="Decrement"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  );
};
