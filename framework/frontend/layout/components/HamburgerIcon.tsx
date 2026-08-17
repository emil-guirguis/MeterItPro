import React from 'react';
import './HamburgerIcon.css';

interface HamburgerIconProps {
  isOpen: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * HamburgerIcon Component
 * 
 * Animated hamburger menu icon that transforms to an X when open.
 */
export const HamburgerIcon: React.FC<HamburgerIconProps> = ({ 
  isOpen, 
  className = ''
}) => {
  return (
    <div 
      className={`hamburger-icon ${isOpen ? 'open' : ''} ${className}`}
      aria-hidden="true"
    >
      <span className="hamburger-line hamburger-line--top" />
      <span className="hamburger-line hamburger-line--middle" />
      <span className="hamburger-line hamburger-line--bottom" />
    </div>
  );
};
