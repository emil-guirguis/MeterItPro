import React, { useMemo } from 'react';
import { Chip, Switch, Box } from '@mui/material';
import { BaseList } from '@framework/components/list/BaseList';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { ColumnDefinition } from '@framework/components/list/types';
import type { NotificationRule } from '../../services/notificationRuleService';
import { useNotificationRulesEnhanced } from './notificationRulesStore';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';

const RULE_TYPE_LABELS: Record<string, string> = {
  custom: 'Custom',
  meter_no_reading: 'No Reading Alert',
  meter_zero_reading: 'Zero Reading',
};

const RULE_TYPE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  custom: 'default',
  meter_no_reading: 'warning',
  meter_zero_reading: 'error',
};

interface NotificationRulesListProps {
  onRuleEdit?: (rule: NotificationRule) => void;
  onRuleCreate?: () => void;
}

export const NotificationRulesList: React.FC<NotificationRulesListProps> = ({
  onRuleEdit,
  onRuleCreate,
}) => {
  const auth = useAuth();
  const { schema } = useSchema('notification_rule');
  const rulesStore = useNotificationRulesEnhanced();

  const columns = useMemo((): ColumnDefinition<NotificationRule>[] => {
    if (!schema?.formFields) return [];

    const generated = generateColumnsFromSchema(schema.formFields);

    return generated.map((col) => {
      if (col.key === 'rule_type') {
        return {
          ...col,
          render: (value: string) => (
            <Chip
              label={RULE_TYPE_LABELS[value] || value}
              color={RULE_TYPE_COLORS[value] || 'default'}
              size="small"
              variant="outlined"
            />
          ),
        };
      }

      if (col.key === 'active') {
        return {
          ...col,
          render: (value: boolean, row: NotificationRule) => (
            <Switch
              checked={value}
              onChange={(e) => {
                rulesStore.toggleActive(row.notification_rule_id, e.target.checked);
              }}
              size="small"
            />
          ),
        };
      }

      if (col.key === 'schedule_cron') {
        return {
          ...col,
          render: (value: string) => (
            <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {value}
            </Box>
          ),
        };
      }

      return col;
    });
  }, [schema, rulesStore]);

  const filters = useMemo(() => {
    if (!schema?.formFields) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const baseList = useBaseList<NotificationRule, ReturnType<typeof useNotificationRulesEnhanced>>({
    entityName: 'notification_rule',
    entityNamePlural: 'notification_rules',
    useStore: useNotificationRulesEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: false,
      allowExport: false,
      allowImport: false,
      allowSearch: false,
      allowFilters: true,
      allowStats: false,
    },
    permissions: {
      create: Permission.NOTIFICATION_RULE_CREATE,
      update: Permission.NOTIFICATION_RULE_UPDATE,
      delete: Permission.NOTIFICATION_RULE_DELETE,
    },
    columns,
    filters,
    onEdit: onRuleEdit,
    onCreate: onRuleCreate,
    authContext: auth,
  });

  return (
    <div className="notification-rules-list">
      <BaseList
        title="Notification Rules"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No notification rules yet. Create one to monitor your meters."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        pagination={baseList.pagination}
      />
      {baseList.renderDeleteConfirmation()}
    </div>
  );
};

export default NotificationRulesList;
