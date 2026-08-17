// UI types - shared across framework
import type { ReactNode } from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface ColumnDefinition<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  responsive?: 'always-show' | 'hide-mobile' | 'hide-tablet';
  className?: string;
  render?: (value: any, item: T, index: number) => ReactNode;
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface BulkAction<T> {
  id: string;
  key?: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  confirm?: boolean;
  confirmMessage?: string;
  action: (items: T[]) => Promise<void>;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSelect?: (selected: T[]) => void;
  pagination?: PaginationConfig;
  bulkActions?: BulkAction<T>[];
  headerActions?: ReactNode;
  responsive?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}
