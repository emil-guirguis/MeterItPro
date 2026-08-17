/**
 * List configuration helper functions
 * Temporary helpers until full framework migration
 */

import React from 'react';
import type { ColumnDefinition } from '../types/ui';
import type { FilterDefinition, BulkActionConfig } from '@meterit/framework-frontend/components/list/types/list';

// Column helpers
export function createTwoLineColumn<T>(
  primaryField: keyof T,
  label: string,
  secondaryField: keyof T,
  options?: any
): ColumnDefinition<T> {
  return {
    key: primaryField as string,
    label,
    render: options?.secondaryRender 
      ? (_value: any, row: T) => 
          React.createElement('div', { className: 'table-cell--two-line' },
            React.createElement('div', { className: 'table-cell__primary' }, String(row[primaryField])),
            React.createElement('div', { className: 'table-cell__secondary' }, options.secondaryRender(row))
          )
      : (_value: any, row: T) => 
          React.createElement('div', { className: 'table-cell--two-line' },
            React.createElement('div', { className: 'table-cell__primary' }, String(row[primaryField])),
            React.createElement('div', { className: 'table-cell__secondary' }, String(row[secondaryField]))
          ),
    sortable: options?.sortable,
    responsive: options?.responsive,
  };
}

export function createStatusColumn<T>(
  field: keyof T,
  label: string,
  options?: any
): ColumnDefinition<T> {
  return {
    key: String(field),
    label,
    render: (_value: any, row: T) => {
      const status = row[field];
      const statusStr = String(status);
      const displayLabel = options?.labels?.[statusStr] || statusStr;
      
      // If indicator light mode is enabled
      if (options?.indicatorLight) {
        const isActive = statusStr === 'active';
        const indicatorClass = isActive ? 'status-indicator--active' : 'status-indicator--inactive';
        
        return React.createElement('div', { className: 'status-indicator-wrapper' },
          React.createElement('span', { 
            className: `status-indicator ${indicatorClass}`,
            'aria-label': displayLabel,
            title: displayLabel
          }),
          React.createElement('span', { className: 'status-indicator-label' }, displayLabel)
        );
      }
      
      // Default badge mode
      const badgeClass = statusStr === 'active' ? 'badge--success' : 'badge--secondary';
      return React.createElement('span', { className: `badge ${badgeClass}` }, displayLabel);
    },
    responsive: options?.responsive,
    sortable: options?.sortable,
  };
}

export function createDateColumn<T>(
  field: keyof T,
  label: string,
  options?: any
): ColumnDefinition<T> {
  return {
    key: String(field),
    label,
    render: (_value: any, row: T) => {
      const date = row[field];
      if (!date) return '';
      
      const dateObj = new Date(date as any);
      return dateObj.toLocaleDateString();
    },
    responsive: options?.responsive,
    sortable: options?.sortable,
  };
}

export function createLocationColumn<T>(
  cityKey: keyof T,
  stateKey: keyof T,
  label: string,
  options?: any
): ColumnDefinition<T> {
  return {
    key: String(cityKey),
    label,
    render: (_value: any, row: T) => {
      const city = row[cityKey];
      const state = row[stateKey];
      const zip = options?.zipKey ? row[options.zipKey as keyof T] : null;
      
      const parts = [city, state, zip].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : (options?.fallback || '');
    },
    responsive: options?.responsive,
    sortable: options?.sortable,
  };
}

export function createBadgeListColumn<T>(
  field: keyof T,
  label: string,
  options?: any
): ColumnDefinition<T> {
  return {
    key: String(field),
    label,
    render: (_value: any, row: T) => {
      const tags = row[field];
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return React.createElement('span', { className: 'text-muted' }, options?.emptyText || 'None');
      }
      
      const maxVisible = options?.maxVisible || tags.length;
      const visibleTags = tags.slice(0, maxVisible);
      const remaining = tags.length - maxVisible;
      const variant = options?.variant || 'neutral';
      
      const badges = visibleTags.map((tag: string, index: number) => 
        React.createElement('span', { key: index, className: `badge badge--${variant}` }, tag)
      );
      
      if (remaining > 0) {
        badges.push(
          React.createElement('span', { key: visibleTags.length, className: 'badge badge--secondary' }, `+${remaining}`)
        );
      }
      
      return React.createElement('div', { className: 'badge-list' }, ...badges);
    },
    sortable: options?.sortable ?? false,
    responsive: options?.responsive,
  };
}

export function createPhoneColumn<T>(
  field: keyof T,
  label: string,
  options?: any
): ColumnDefinition<T> {
  return {
    key: String(field),
    label,
    render: (_value: any, row: T) => {
      const phone = row[field];
      return phone ? String(phone) : '';
    },
    responsive: options?.responsive,
    sortable: options?.sortable,
  };
}

// Filter helpers
export function createStatusFilter(key: string = 'active', options?: any): FilterDefinition {
  return {
    key,
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Active', value: 'true' },
      { label: 'Inactive', value: 'false' },
    ],
    ...options
  };
}

export function createRoleFilter(key: string, options: any[] = []): FilterDefinition {
  return {
    key,
    label: 'Type',
    type: 'select',
    options,
    placeholder: 'All Types',
  };
}

// Bulk action helpers
export function createStandardStatusActions<T>(
  entityName: string,
  entityNamePlural: string,
  bulkUpdateStatus: (ids: string[], status: string) => Promise<void>,
  options?: any
): BulkActionConfig<T>[] {
  return [
    {
      id: 'activate',
      label: 'Activate',
      icon: 'check',
      color: 'success',
      confirm: true,
      confirmMessage: (items: T[]) => `Activate ${items.length} ${items.length === 1 ? entityName : entityNamePlural}?`,
      action: async (items: T[]) => {
        const ids = items.map((item: any) => item.id);
        await bulkUpdateStatus(ids, 'active');
      },
      requirePermission: options?.requirePermission,
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: 'x',
      color: 'warning',
      confirm: true,
      confirmMessage: (items: T[]) => `Deactivate ${items.length} ${items.length === 1 ? entityName : entityNamePlural}?`,
      action: async (items: T[]) => {
        const ids = items.map((item: any) => item.id);
        await bulkUpdateStatus(ids, 'inactive');
      },
      requirePermission: options?.requirePermission,
    },
  ];
}

export function createExportAction<T>(exportFunction: (items: T[]) => void): BulkActionConfig<T> {
  return {
    id: 'export',
    label: 'Export Selected',
    icon: 'download',
    color: 'secondary',
    action: async (items: T[]) => {
      exportFunction(items);
    },
  };
}
