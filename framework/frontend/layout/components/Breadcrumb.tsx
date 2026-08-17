import React from 'react';
import { Link } from 'react-router-dom';
import type { BreadcrumbItem } from '../types';
import './Breadcrumb.css';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string;
  className?: string;
}

/**
 * Breadcrumb Component
 * 
 * Framework-provided breadcrumb navigation with:
 * - Clickable links for navigation
 * - Custom separator support
 * - Icon support
 * - Responsive design
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = '/',
  className = ''
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav 
      className={`breadcrumb ${className}`}
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li 
              key={`${item.path || item.label}-${index}`}
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
            >
              {item.icon && (
                <span className="breadcrumb-icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              
              {item.path && !isLast ? (
                <Link 
                  to={item.path}
                  className="breadcrumb-link"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className="breadcrumb-text"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
