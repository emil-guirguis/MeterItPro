/**
 * DashboardWidget Component
 * 
 * Generic container for dashboard widgets with loading, error, and collapse functionality
 */

import React, { useState, useEffect } from 'react';
import type { WidgetProps } from '../types/widget';
import './DashboardWidget.css';

/**
 * Generic dashboard widget container
 * 
 * @example
 * ```tsx
 * <DashboardWidget
 *   id="stats-widget"
 *   title="Statistics"
 *   collapsible
 *   refreshable
 *   onRefresh={handleRefresh}
 * >
 *   <div>Widget content here</div>
 * </DashboardWidget>
 * ```
 */
export const DashboardWidget: React.FC<WidgetProps> = ({
  id,
  title,
  children,
  className = '',
  style = {},
  loading = false,
  error = null,
  collapsible = false,
  defaultCollapsed = false,
  refreshable = false,
  onRefresh,
  onToggleCollapse
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const storageKey = `widget-${id}-collapsed`;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setCollapsed(JSON.parse(stored));
    }
  }, [id]);

  // Save collapsed state to localStorage
  useEffect(() => {
    const storageKey = `widget-${id}-collapsed`;
    localStorage.setItem(storageKey, JSON.stringify(collapsed));
  }, [id, collapsed]);

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={`dashboard-widget ${className}`} style={style as any}>
      {title && (
        <div className="dashboard-widget__header">
          <h3 className="dashboard-widget__title">{title}</h3>
          <div className="dashboard-widget__actions">
            {refreshable && (
              <button
                type="button"
                className={`dashboard-widget__action dashboard-widget__action--refresh ${
                  isRefreshing ? 'dashboard-widget__action--refreshing' : ''
                }`}
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh widget"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4v1H6.5a.5.5 0 000 1H9a.5.5 0 00.5-.5V3a.5.5 0 00-1 0v.5A5.001 5.001 0 008 3z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            {collapsible && (
              <button
                type="button"
                className={`dashboard-widget__action dashboard-widget__action--collapse ${
                  collapsed ? 'dashboard-widget__action--collapsed' : ''
                }`}
                onClick={handleToggleCollapse}
                aria-label={collapsed ? 'Expand widget' : 'Collapse widget'}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 6.293a1 1 0 011.414 0L8 8.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={`dashboard-widget__content ${
          collapsed ? 'dashboard-widget__content--collapsed' : ''
        }`}
      >
        {loading ? (
          <div className="dashboard-widget__loading">
            <div className="dashboard-widget__spinner"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="dashboard-widget__error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                clipRule="evenodd"
              />
            </svg>
            <p>{error}</p>
            {refreshable && (
              <button
                type="button"
                className="dashboard-widget__retry"
                onClick={handleRefresh}
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
