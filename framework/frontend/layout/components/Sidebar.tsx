import React, { useState, useRef, useEffect } from 'react';
import type { SidebarProps } from '../types';
import { getIconElement } from '../../utils/iconHelper';
import './Sidebar.css';

/**
 * Sidebar Component
 * 
 * Framework-provided sidebar navigation component with:
 * - Collapsible state
 * - Nested menu items
 * - Active state highlighting
 * - Tooltips in collapsed mode
 * - Responsive behavior
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobile,
  menuItems,
  currentPath,
  onToggle,
  onNavigate,
  sidebarContent
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const asideRef = useRef<HTMLElement | null>(null);

  // Auto-expand parent menus when their children are active
  useEffect(() => {
    const parentsToExpand: string[] = [];
    
    const findActiveParents = (items: any[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          const hasActiveChild = item.children.some((child: any) => child.path === currentPath);
          if (hasActiveChild) {
            parentsToExpand.push(item.id);
          }
        }
      });
    };
    
    findActiveParents(menuItems);
    
    if (parentsToExpand.length > 0) {
      setExpandedItems(prev => {
        const newExpanded = [...prev];
        parentsToExpand.forEach(id => {
          if (!newExpanded.includes(id)) {
            newExpanded.push(id);
          }
        });
        return newExpanded;
      });
    }
  }, [currentPath, menuItems]);

  const handleItemClick = (item: any) => {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      // When collapsed, clicking expands the sidebar first, then toggle submenu
      if (isCollapsed && !isMobile) {
        onToggle(); // Expand the sidebar
        // Also expand the submenu
        setExpandedItems(prev => 
          prev.includes(item.id) 
            ? prev
            : [...prev, item.id]
        );
      } else {
        // Toggle submenu when sidebar is expanded
        setExpandedItems(prev => 
          prev.includes(item.id) 
            ? prev.filter(id => id !== item.id)
            : [...prev, item.id]
        );
      }
    } else {
      // Navigate to page - let parent handle navigation
      onNavigate(item.path);
    }
  };

  const isItemActive = (item: any): boolean => {
    if (item.path === currentPath) return true;
    if (item.children) {
      return item.children.some((child: any) => child.path === currentPath);
    }
    return false;
  };

  const renderMenuItem = (item: any, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <li key={item.id} className={`sidebar-item ${level > 0 ? 'sidebar-item--child' : ''}`}>
        <div
          className={`sidebar-link ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleItemClick(item);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleItemClick(item);
            }
          }}
        >
          <div className="sidebar-link__content">
            <span className="sidebar-icon">
              {getIconElement(item.icon || item.id)}
            </span>
            {(!isCollapsed || isMobile) && (
              <>
                <span className="sidebar-label">{item.label}</span>
                {item.badge && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
                {hasChildren && (
                  <span className={`sidebar-arrow ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Submenu */}
        {hasChildren && (!isCollapsed || isMobile) && (
          <ul className={`sidebar-submenu ${isExpanded ? 'expanded' : ''}`}>
            {item.children.map((child: any) => renderMenuItem(child, level + 1))}
          </ul>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && !isMobile && (
          <div className="sidebar-tooltip">
            {item.label}
            {item.badge && <span className="tooltip-badge">{item.badge}</span>}
          </div>
        )}
      </li>
    );
  };

  return (
    <aside 
      ref={asideRef}
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
      aria-label="Main navigation"
    >
      {/* Custom Sidebar Content (e.g., Meters Section) */}
      {sidebarContent && !isCollapsed && !isMobile && (
        <div className="sidebar__custom-content">
          {sidebarContent}
        </div>
      )}

      <nav className="sidebar__nav" id="main-navigation">
        <ul className="sidebar-menu">
          {menuItems.map(item => renderMenuItem(item))}
        </ul>
      </nav>
    </aside>
  );
};
