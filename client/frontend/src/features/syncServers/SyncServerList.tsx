import React, { useMemo } from 'react';
import Chip from '@mui/material/Chip';
import { BaseList } from '@framework/components/list/BaseList';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';
import { useSyncServersEnhanced } from './syncServersStore';
import { showConfirmation } from '@framework/utils/confirmationHelper';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'default',
  provisioning: 'info',
  active: 'success',
  error: 'error',
};

interface SyncServerListProps {
  onEdit?: (server: any) => void;
  onCreate?: () => void;
}

export const SyncServerList: React.FC<SyncServerListProps> = ({ onEdit, onCreate }) => {
  const store = useSyncServersEnhanced();
  const auth = useAuth();
  const { schema } = useSchema('sync_server');

  const columns = useMemo(() => {
    if (!schema) return [];

    // Build list columns manually — provision_status needs custom render
    // and tunnel_url lives in entityFields (not formFields) so add it explicitly
    const schemaColumns = generateColumnsFromSchema<any>(schema.formFields, {
      fieldOrder: ['name', 'timezone', 'active', 'provision_status'],
      responsive: 'hide-mobile',
    });

    return schemaColumns.map((col) => {
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
  }, [schema, store]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const handleDelete = (server: any) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Sync Server',
      message: `Delete "${server.name}"?${server.tunnel_id ? ' This will also remove the Cloudflare tunnel and DNS record.' : ''}`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await store.deleteItem(String(server.sync_server_id));
      },
    });
  };

  const baseList = useBaseList<any, any>({
    entityName: 'sync_server',
    entityNamePlural: 'sync servers',
    useStore: useSyncServersEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: false,
      allowExport: false,
      allowSearch: true,
      allowFilters: false,
      allowStats: false,
    },
    permissions: {
      create: Permission.SETTINGS_UPDATE,
      update: Permission.SETTINGS_UPDATE,
      delete: Permission.SETTINGS_UPDATE,
    },
    columns,
    filters,
    onEdit,
    onCreate,
    authContext: auth,
  });

  return (
    <BaseList
      data={baseList.data}
      columns={baseList.columns}
      loading={baseList.loading}
      error={baseList.error}
      onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
      onEdit={baseList.handleEdit}
      onDelete={handleDelete}
      emptyMessage="No sync servers configured."
      pagination={baseList.pagination}
    />
  );
};
