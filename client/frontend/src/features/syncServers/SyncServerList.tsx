import React, { useMemo } from 'react';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { BaseList } from '@framework/components/list/BaseList';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import { useAuth } from '../../hooks/useAuth';
import { useSyncServersEnhanced } from './syncServersStore';
import type { ColumnDefinition } from '@framework/components/list/types/ui';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'default',
  provisioning: 'info',
  active: 'success',
  error: 'error',
};

export const SyncServerList: React.FC = () => {
  const auth = useAuth();
  const { schema } = useSchema('sync_server');

  const connectColumn: ColumnDefinition<any> = useMemo(() => ({
    key: 'connect',
    label: '',
    align: 'center' as const,
    render: (_v: unknown, row: any) => row.tunnel_url ? (
      <Tooltip title="Open sync server dashboard">
        <IconButton size="small" component="a" href={row.tunnel_url} target="_blank" rel="noopener noreferrer">
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ) : null,
  }), []);

  const columns = useMemo(() => {
    if (!schema) return [];

    const schemaColumns = generateColumnsFromSchema<any>(schema.formFields, {
      fieldOrder: ['name', 'timezone', 'active', 'provision_status'],
      responsive: 'hide-mobile',
    });

    const mapped = schemaColumns.map((col) => {
      if (String(col.key) === 'provision_status') {
        return [{
          ...col,
          render: (_v: any, row: any) => (
            <Chip
              label={row.provision_status === 'provisioning' ? 'provisioning…' : (row.provision_status || 'pending')}
              color={STATUS_COLORS[row.provision_status] ?? 'default'}
              size="small"
            />
          ),
        }];
      }
      return [col];
    }).flat();

    return [...mapped, connectColumn];
  }, [schema, connectColumn]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const baseList = useBaseList<any, any>({
    entityName: 'sync_server',
    entityNamePlural: 'sync servers',
    useStore: useSyncServersEnhanced,
    features: {
      allowCreate: false,
      allowEdit: false,
      allowDelete: false,
      allowBulkActions: false,
      allowExport: false,
      allowSearch: true,
      allowFilters: false,
      allowStats: false,
    },
    columns,
    filters,
    authContext: auth,
  });

  return (
    <BaseList
      data={baseList.data}
      columns={baseList.columns}
      loading={baseList.loading}
      error={baseList.error}
      emptyMessage="No sync servers configured."
      pagination={baseList.pagination}
    />
  );
};
