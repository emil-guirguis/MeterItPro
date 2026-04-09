import React, { useEffect, useState } from 'react';
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

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  menuItems,
  currentPath,
  onNavigate,
  sidebarContent
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const hasContent = !!item.content;

    if (hasChildren || hasContent) {
      toggleExpanded(item.id);
    } else {
      onNavigate(item.path);
      onClose();
    }
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (item.isActive !== undefined) return item.isActive;
    if (item.path === currentPath) return true;
    if (item.children) return item.children.some(child => child.path === currentPath);
    return false;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const hasContent = !!item.content;
    const isExpandable = hasChildren || hasContent;

    return (
      <li key={item.id} className="mobile-menu-item">
        <button
          className={`mobile-menu-link ${isActive ? 'active' : ''} ${level > 0 ? 'mobile-menu-link--child' : ''}`}
          onClick={() => handleItemClick(item)}
          type="button"
        >
          <span className="menu-icon">{getIconElement(item.icon)}</span>
          <span className="menu-label">{item.label}</span>
          {item.badge && <span className="menu-badge">{item.badge}</span>}
          {isExpandable
            ? <span className={`menu-arrow menu-arrow--expand ${isExpanded ? 'menu-arrow--expanded' : ''}`}>▼</span>
            : <span className="menu-arrow">›</span>
          }
        </button>

        {/* Children submenu */}
        {hasChildren && isExpanded && (
          <ul className="mobile-submenu-list">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </ul>
        )}

        {/* Inline custom content */}
        {hasContent && isExpanded && (
          <div className="mobile-menu-item__content">
            {item.content}
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

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
            {menuItems.map(item => renderMenuItem(item))}
          </ul>
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
