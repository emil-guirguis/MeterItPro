import React from 'react';
import './FormTabs.css';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import DeveloperBoardOutlinedIcon from '@mui/icons-material/DeveloperBoardOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RouterOutlinedIcon from '@mui/icons-material/RouterOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import DeviceHubOutlinedIcon from '@mui/icons-material/DeviceHubOutlined';

export interface FormTabsProps {
  tabs: Record<string, { label: string; order: number }>;
  tabList: string[];
  activeTab: string;
  onTabChange: (tabName: string) => void;
  className?: string;
  /** Optional content rendered on the right side of the tab bar */
  actions?: React.ReactNode;
  /** Tab names that have validation errors — shows a red dot badge */
  tabErrors?: Record<string, boolean>;
}

// Maps tab name keywords → icon component (mirrors BaseForm's section icons)
const TAB_ICONS: Array<[RegExp, React.ElementType]> = [
  [/element|combined|register/i, DeveloperBoardOutlinedIcon],
  [/network|connect/i,           RouterOutlinedIcon],
  [/additional|note|more|info/i, NotesOutlinedIcon],
  [/setting|config|advanced/i,   SettingsOutlinedIcon],
  [/audit|history|log/i,         HistoryOutlinedIcon],
  [/combined|virtual/i,          DeviceHubOutlinedIcon],
  [/meter|main|general|detail/i, SpeedOutlinedIcon],
];

function getTabIcon(tabName: string): React.ReactElement | null {
  for (const [pattern, Icon] of TAB_ICONS) {
    if (pattern.test(tabName)) {
      return <Icon className="form-tabs__tab-icon" sx={{ fontSize: 18 }} />;
    }
  }
  return <InfoOutlinedIcon className="form-tabs__tab-icon" sx={{ fontSize: 18 }} />;
}

/**
 * FormTabs Component
 *
 * Provides consistent tab navigation for forms with Material Design 3 styling.
 * Used by forms that have multiple tabs/sections.
 */
export const FormTabs: React.FC<FormTabsProps> = ({
  tabs,
  tabList,
  activeTab,
  onTabChange,
  className = '',
  actions,
  tabErrors = {},
}) => {
  if (tabList.length <= 1) {
    return null;
  }

  return (
    <div className={`form-tabs ${className}`}>
      <div className="form-tabs__tabs">
        {tabList.map((tabName) => {
          const hasError = tabErrors[tabName];
          return (
            <button
              key={tabName}
              className={`form-tabs__tab ${activeTab === tabName ? 'form-tabs__tab--active' : ''}${hasError ? ' form-tabs__tab--error' : ''}`}
              onClick={() => onTabChange(tabName)}
              type="button"
            >
              {getTabIcon(tabName)}
              {tabs[tabName].label}
              {hasError && <span className="form-tabs__tab-error-dot" aria-label="has errors" />}
            </button>
          );
        })}
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
