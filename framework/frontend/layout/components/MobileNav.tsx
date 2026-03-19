import React, { useEffect } from 'react';
import type { MenuItem } from '../types';
import { getIconElement } from '../../utils/iconHelper';
import './MobileNav.css';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  sidebarContent?: React.ReactNode;
}

/**
 * MobileNav Component
 * 
 * Framework-provided mobile navigation drawer with:
 * - Slide-in animation
 * - Backdrop overlay
 * - Menu items with icons
 * - Quick actions
 * - Logout button
 */
export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  menuItems,
  currentPath,
  onNavigate,
  sidebarContent
}) => {

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleItemClick = (item: MenuItem) => {
    onNavigate(item.path);
    onClose();
  };

  return (
    <>
      {/* Backdrop - only show when open */}
      {isOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <nav 
        className={`mobile-nav ${isOpen ? 'open' : ''}`}
        aria-label="Mobile navigation"
        role="navigation"
        id="main-navigation"
      >
        {/* Sidebar Content (Favorites, Meter Readings, etc.) */}
        {sidebarContent && (
          <div className="mobile-nav__sidebar-content">
            {sidebarContent}
          </div>
        )}

        {/* Navigation Menu */}
        <div className="mobile-nav__menu">
          <ul className="mobile-menu-list">
            {menuItems.map((item) => (
              <li key={item.id} className="mobile-menu-item">
                <button
                  className={`mobile-menu-link ${
                    currentPath === item.path ? 'active' : ''
                  }`}
                  onClick={() => handleItemClick(item)}
                  type="button"
                >
                  <span className="menu-icon">
                    {getIconElement(item.icon)}
                  </span>
                  <span className="menu-label">{item.label}</span>
                  {item.badge && (
                    <span className="menu-badge">{item.badge}</span>
                  )}
                  <span className="menu-arrow">›</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="mobile-nav__actions">
          <button 
            className="mobile-action-button"
            onClick={() => {
              onNavigate('/profile');
              onClose();
            }}
            type="button"
          >
            <span className="action-icon">
              {getIconElement('person')}
            </span>
            <span className="action-label">Profile</span>
          </button>
          <button 
            className="mobile-action-button"
            onClick={() => {
              onNavigate('/settings');
              onClose();
            }}
            type="button"
          >
            <span className="action-icon">
              {getIconElement('settings')}
            </span>
            <span className="action-label">Settings</span>
          </button>
          <button 
            className="mobile-action-button"
            onClick={() => {
              onNavigate('/help');
              onClose();
            }}
            type="button"
          >
            <span className="action-icon">
              {getIconElement('help')}
            </span>
            <span className="action-label">Help</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mobile-nav__footer">
          <div className="app-version">
            <span>Version 1.0.0</span>
          </div>
        </div>
      </nav>
    </>
  );
};
