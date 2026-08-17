/**
 * List Component Framework - Column Definition Helpers
 * 
 * Provides helper functions for creating common column types with consistent
 * formatting and behavior. These helpers reduce boilerplate when defining
 * table columns for list components.
 */

import React from 'react';
import type { ColumnDefinition } from '../types/ui';
import {
  renderStatusBadge,
  renderTwoLineCell,
  renderDateCell,
  renderBadgeList,
  renderBadge,
  renderPhoneCell,
  renderEmailCell,
  renderLocationCell,
  renderNumberCell,
  renderBooleanCell,
} from '../utils/renderHelpers';

/**
 * Create a simple text column with optional custom render function.
 * 
 * @param key - Property key
 * @param label - Column header label
 * @param options - Additional column options
 * @returns Column definition
 * 
 * @example
 * createTextColumn('name', 'Name', { sortable: true })
 */
export function createTextColumn<T>(
  key: keyof T & string,
  label: string,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    className?: string;
    render?: (value: any, item: T) => React.ReactNode;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    className: options?.className,
    render: options?.render || ((value) => value || 'N/A'),
  };
}

/**
 * Create a status column with badge indicator.
 * 
 * @param key - Property key for status
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createStatusColumn('status', 'Status')
 * createStatusColumn('status', 'Status', { 
 *   labels: { active: 'Online', inactive: 'Offline' }
 * })
 */
export function createStatusColumn<T>(
  key: keyof T & string,
  label: string = 'Status',
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    labels?: Record<string, string>;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (value) => {
      const displayLabel = options?.labels?.[value] || undefined;
      return renderStatusBadge(value, displayLabel);
    },
  };
}

/**
 * Create a two-line column showing primary and secondary information.
 * 
 * @param key - Property key for primary value
 * @param label - Column header label
 * @param secondaryKey - Property key for secondary value
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createTwoLineColumn('name', 'Contact', 'email')
 * createTwoLineColumn('name', 'User', 'role', { 
 *   secondaryRender: (item) => <Badge>{item.role}</Badge>
 * })
 */
export function createTwoLineColumn<T>(
  key: keyof T & string,
  label: string,
  secondaryKey: keyof T & string,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    className?: string;
    secondaryRender?: (item: T) => React.ReactNode;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    className: options?.className,
    render: (value, item) => {
      const secondary = options?.secondaryRender
        ? options.secondaryRender(item)
        : (item[secondaryKey] as any) || '';
      return renderTwoLineCell(value || 'N/A', secondary);
    },
  };
}

/**
 * Create a date column with formatted display.
 * 
 * @param key - Property key for date value
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createDateColumn('createdAt', 'Created')
 * createDateColumn('lastLogin', 'Last Login', { format: 'datetime' })
 */
export function createDateColumn<T>(
  key: keyof T & string,
  label: string,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    format?: 'short' | 'long' | 'datetime';
    fallback?: string;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (value) => renderDateCell(value, options?.format, options?.fallback),
  };
}

/**
 * Create a phone number column with clickable tel: link.
 * 
 * @param key - Property key for phone number
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createPhoneColumn('phone', 'Phone')
 */
export function createPhoneColumn<T>(
  key: keyof T & string,
  label: string = 'Phone',
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    fallback?: string;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (value) => renderPhoneCell(value, options?.fallback),
  };
}

/**
 * Create an email column with clickable mailto: link.
 * 
 * @param key - Property key for email
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createEmailColumn('email', 'Email')
 */
export function createEmailColumn<T>(
  key: keyof T & string,
  label: string = 'Email',
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    fallback?: string;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (value) => renderEmailCell(value, options?.fallback),
  };
}

/**
 * Create a location column showing city, state, and optional zip.
 * 
 * @param cityKey - Property key for city
 * @param stateKey - Property key for state
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createLocationColumn('city', 'state', 'Location')
 * createLocationColumn('city', 'state', 'Location', { zipKey: 'zipCode' })
 */
export function createLocationColumn<T>(
  cityKey: keyof T & string,
  stateKey: keyof T & string,
  label: string = 'Location',
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    zipKey?: keyof T & string;
    fallback?: string;
  }
): ColumnDefinition<T> {
  return {
    key: cityKey,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (_, item) => {
      const city = item[cityKey] as any;
      const state = item[stateKey] as any;
      const zip = options?.zipKey ? (item[options.zipKey] as any) : undefined;
      return renderLocationCell(city, state, zip, options?.fallback);
    },
  };
}

/**
 * Create a badge list column for displaying tags or categories.
 * 
 * @param key - Property key for array of items
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createBadgeListColumn('tags', 'Tags')
 * createBadgeListColumn('categories', 'Categories', { maxVisible: 3, variant: 'primary' })
 */
export function createBadgeListColumn<T>(
  key: keyof T & string,
  label: string,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    maxVisible?: number;
    variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error';
    emptyText?: string;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? false,
    responsive: options?.responsive,
    render: (value) => renderBadgeList(
      value,
      options?.maxVisible,
      options?.variant,
      options?.emptyText
    ),
  };
}

/**
 * Create a single badge column for displaying a category or type.
 * 
 * @param key - Property key
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createBadgeColumn('role', 'Role', { variant: 'primary' })
 * createBadgeColumn('type', 'Type', { 
 *   variantMap: { admin: 'error', user: 'neutral' }
 * })
 */
export function createBadgeColumn<T>(
  key: keyof T & string,
  label: string,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error';
    variantMap?: Record<string, 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error'>;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (value) => {
      if (!value) {
        return React.createElement('span', { className: 'table-cell__empty' }, 'N/A');
      }
      const variant = options?.variantMap?.[value] || options?.variant || 'neutral';
      return renderBadge(value, variant);
    },
  };
}

/**
 * Create a number column with optional formatting.
 * 
 * @param key - Property key
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createNumberColumn('count', 'Count')
 * createNumberColumn('price', 'Price', { 
 *   format: { style: 'currency', currency: 'USD' }
 * })
 */
export function createNumberColumn<T>(
  key: keyof T & string,
  label: string,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    format?: Intl.NumberFormatOptions;
    fallback?: string;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (value) => renderNumberCell(value, options?.format, options?.fallback),
  };
}

/**
 * Create a boolean column displaying Yes/No or custom labels.
 * 
 * @param key - Property key
 * @param label - Column header label
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createBooleanColumn('isActive', 'Active')
 * createBooleanColumn('verified', 'Verified', { 
 *   trueLabel: 'Verified', 
 *   falseLabel: 'Not Verified',
 *   variant: 'success'
 * })
 */
export function createBooleanColumn<T>(
  key: keyof T & string,
  label: string,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    trueLabel?: string;
    falseLabel?: string;
    variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error';
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? true,
    responsive: options?.responsive,
    render: (value) => renderBooleanCell(
      value,
      options?.trueLabel,
      options?.falseLabel,
      options?.variant
    ),
  };
}

/**
 * Create a custom column with full control over rendering.
 * 
 * @param key - Property key
 * @param label - Column header label
 * @param render - Custom render function
 * @param options - Additional options
 * @returns Column definition
 * 
 * @example
 * createCustomColumn('actions', 'Actions', (_, item) => (
 *   <button onClick={() => handleAction(item)}>Action</button>
 * ), { sortable: false })
 */
export function createCustomColumn<T>(
  key: keyof T & string,
  label: string,
  render: (value: any, item: T) => React.ReactNode,
  options?: {
    sortable?: boolean;
    responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
    className?: string;
  }
): ColumnDefinition<T> {
  return {
    key,
    label,
    sortable: options?.sortable ?? false,
    responsive: options?.responsive,
    className: options?.className,
    render,
  };
}
