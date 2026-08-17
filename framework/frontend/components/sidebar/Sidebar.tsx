import React, { useState } from 'react';
import type { ReactNode } from 'react';
import './Sidebar.css';

export interface SidebarSectionProps {
  title: string;
  content: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface SidebarProps {
  sections?: SidebarSectionProps[];
  children?: ReactNode;
  className?: string;
}

/**
 * Sidebar Component
 * 
 * Reusable sidebar component for both lists and forms.
 * Provides collapsible sections for actions, stats, and other metadata.
 * 
 * Used by:
 * - BaseList: for actions and stats
 * - BaseForm: for actions and metadata
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   sections={[
 *     {
 *       title: 'Actions',
 *       content: <ActionsComponent />,
 *       collapsible: true,
 *       defaultCollapsed: false
 *     },
 *     {
 *       title: 'Stats',
 *       content: <StatsComponent />,
 *       collapsible: true,
 *       defaultCollapsed: false
 *     }
 *   ]}
 * />
 * ```
 */
export const Sidebar: React.FC<SidebarProps> = ({
  sections = [],
  children,
  className = '',
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  if (sections.length === 0 && !children) {
    return null;
  }

  return (
    <div className={`sidebar ${className}`}>
      {sections.map((section, index) => {
        const isCollapsed = collapsedSections[section.title] ?? (section.defaultCollapsed || false);

        return (
          <div key={index} className="sidebar__card">
            {section.collapsible !== false && (
              <div
                className="sidebar__card-header"
                onClick={() => toggleSection(section.title)}
              >
                <h3 className="sidebar__card-title">{section.title}</h3>
                <span className="sidebar__card-toggle">
                  {isCollapsed ? '▼' : '▲'}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="sidebar__card-content">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
};

export default Sidebar;
