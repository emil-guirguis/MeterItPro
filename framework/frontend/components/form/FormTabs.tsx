import React from 'react';
import './FormTabs.css';

export interface FormTabsProps {
  tabs: Record<string, { label: string; order: number }>;
  tabList: string[];
  activeTab: string;
  onTabChange: (tabName: string) => void;
  className?: string;
  /** Optional content rendered on the right side of the tab bar */
  actions?: React.ReactNode;
}

/**
 * FormTabs Component
 * 
 * Provides consistent tab navigation for forms with Material Design 3 styling.
 * Used by forms that have multiple tabs/sections.
 * 
 * @example
 * ```tsx
 * <FormTabs
 *   tabs={tabs}
 *   tabList={tabList}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
export const FormTabs: React.FC<FormTabsProps> = ({
  tabs,
  tabList,
  activeTab,
  onTabChange,
  className = '',
  actions,
}) => {
  if (tabList.length <= 1) {
    return null;
  }

  return (
    <div className={`form-tabs ${className}`}>
      <div className="form-tabs__tabs">
        {tabList.map((tabName) => (
          <button
            key={tabName}
            className={`form-tabs__tab ${activeTab === tabName ? 'form-tabs__tab--active' : ''}`}
            onClick={() => onTabChange(tabName)}
            type="button"
          >
            {tabs[tabName].label}
          </button>
        ))}
      </div>
      {actions && (
        <div className="form-tabs__actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default FormTabs;