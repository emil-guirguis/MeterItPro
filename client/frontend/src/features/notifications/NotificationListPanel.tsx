import React, { useMemo } from 'react';
import { Chip } from '@mui/material';
import { BaseList } from '@framework/components/list/BaseList';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { ColumnDefinition } from '@framework/components/list/types';
import type { Notification, NotificationSeverity, NotificationType } from '../../types/notifications';
import { useNotificationsEnhanced } from './notificationsStore';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_COLOR: Record<NotificationSeverity, 'error' | 'warning' | 'info'> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const TYPE_LABEL: Record<NotificationType, string> = {
  stale: 'No Readings',
  all_zero: 'Zero Readings',
  error_status: 'Error',
};

export const NotificationListPanel: React.FC = () => {
  const auth = useAuth();
  const { schema } = useSchema('notification');

  const columns = useMemo((): ColumnDefinition<Notification>[] => {
    if (!schema?.formFields) return [];

    const generated = generateColumnsFromSchema(schema.formFields);

    return generated.map(col => {
      if (col.key === 'severity') {
        return {
          ...col,
          render: (value: NotificationSeverity) => (
            <Chip
              label={value ? value.charAt(0).toUpperCase() + value.slice(1) : '—'}
              color={SEVERITY_COLOR[value] ?? 'default'}
              size="small"
              variant="outlined"
            />
          ),
        };
      }
      if (col.key === 'notification_type') {
        return {
          ...col,
          render: (value: NotificationType) => (
            <Chip label={TYPE_LABEL[value] ?? value} size="small" />
          ),
        };
      }
      if (col.key === 'description') {
        return {
          ...col,
          render: (value: string | null) => value ?? '—',
        };
      }
      if (col.key === 'created_at') {
        return {
          ...col,
          render: (value: string) => {
            try {
              return formatDistanceToNow(new Date(value), { addSuffix: true });
            } catch {
              return value;
            }
          },
        };
      }
      return col;
    });
  }, [schema]);

  const notificationFilters = useMemo(() => {
    if (!schema?.formFields) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const baseList = useBaseList<Notification, ReturnType<typeof useNotificationsEnhanced>>({
    entityName: 'notification',
    entityNamePlural: 'notifications',
    useStore: useNotificationsEnhanced,
    features: {
      allowCreate: false,
      allowEdit: false,
      allowDelete: true,
      allowBulkActions: false,
      allowExport: false,
      allowImport: false,
      allowSearch: false,
      allowFilters: true,
      allowStats: false,
    },
    columns,
    filters: notificationFilters,
    authContext: auth,
  });

  return (
    <div className="notification-list-panel">
      <BaseList
        title="Active Notifications"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No notifications — all meters are healthy."
        onDelete={baseList.handleDelete}
        pagination={baseList.pagination}
      />
      {baseList.renderDeleteConfirmation()}
    </div>
  );
};

export default NotificationListPanel;
