import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, Tooltip } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import { BaseList } from '@framework/components/list/BaseList';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { ColumnDefinition } from '@framework/components/list/types/ui';
import { useAdminSyncServersEnhanced, type AdminSyncServerEntity } from './adminSyncServersStore';

type ProvisionStatus = AdminSyncServerEntity['provision_status'];
type OnlineStatus = 'unknown' | 'online' | 'offline' | 'checking';

const PROVISION_COLORS: Record<ProvisionStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending:      'default',
  provisioning: 'info',
  active:       'success',
  error:        'error',
};

const allowedAuth = { checkPermission: () => true as boolean, user: undefined };

interface AdminSyncServerListProps {
  onEdit?: (row: AdminSyncServerEntity) => void;
  onCreate?: () => void;
}

export const AdminSyncServerList: React.FC<AdminSyncServerListProps> = ({ onEdit, onCreate }) => {
  const store = useAdminSyncServersEnhanced();
  const { schema } = useSchema('admin_sync_server');
  const [onlineStatuses, setOnlineStatuses] = useState<Record<number, OnlineStatus>>({});
  const [provisioning, setProvisioning] = useState<Record<number, boolean>>({});
  const [checkingAll, setCheckingAll] = useState(false);

  const schemaColumns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<AdminSyncServerEntity>(schema.formFields, {
      fieldOrder: ['tenant_name', 'name', 'provision_status'],
    });
  }, [schema]);

  const checkStatus = useCallback(async (row: AdminSyncServerEntity) => {
    if (!row.tunnel_url) return;
    setOnlineStatuses(prev => ({ ...prev, [row.sync_server_id]: 'checking' }));
    try {
      const result = await store.checkStatus(String(row.sync_server_id));
      setOnlineStatuses(prev => ({ ...prev, [row.sync_server_id]: result.online ? 'online' : 'offline' }));
    } catch {
      setOnlineStatuses(prev => ({ ...prev, [row.sync_server_id]: 'offline' }));
    }
  }, [store]);

  const handleProvision = useCallback(async (row: AdminSyncServerEntity) => {
    setProvisioning(prev => ({ ...prev, [row.sync_server_id]: true }));
    try {
      await store.provisionServer(String(row.sync_server_id));
    } finally {
      setProvisioning(prev => ({ ...prev, [row.sync_server_id]: false }));
    }
  }, [store]);

  const baseList = useBaseList<AdminSyncServerEntity, ReturnType<typeof useAdminSyncServersEnhanced>>({
    entityName: 'sync server',
    entityNamePlural: 'sync servers',
    useStore: useAdminSyncServersEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: false,
      allowExport: false,
      allowSearch: true,
      allowFilters: false,
    },
    columns: schemaColumns,
    onEdit,
    onCreate,
    authContext: allowedAuth,
  });

  const checkAll = useCallback(async () => {
    setCheckingAll(true);
    await Promise.all(baseList.data.map(r => checkStatus(r)));
    setCheckingAll(false);
  }, [baseList.data, checkStatus]);

  // Replace plain provision_status text with a colored chip
  const columns = useMemo(() => {
    const cols = baseList.columns.map(col => {
      if (String(col.key) !== 'provision_status') return col;
      return {
        ...col,
        render: (_v: unknown, row: AdminSyncServerEntity) => (
          <Chip label={row.provision_status ?? 'pending'} color={PROVISION_COLORS[row.provision_status] ?? 'default'} size="small" />
        ),
      };
    });

    const onlineCol: ColumnDefinition<AdminSyncServerEntity> = {
      key: 'online_status',
      label: 'Online',
      render: (_v, row) => {
        const s = onlineStatuses[row.sync_server_id] ?? 'unknown';
        if (s === 'checking') return <CircularProgress size={16} />;
        if (s === 'online')   return <Chip label="Online"  color="success" size="small" />;
        if (s === 'offline')  return <Chip label="Offline" color="error"   size="small" />;
        return <Chip label="—" color="default" size="small" />;
      },
    };

    const actionCols: ColumnDefinition<AdminSyncServerEntity>[] = [
      {
        key: 'provision_action',
        label: '',
        align: 'center',
        render: (_v, row) => (
          <Tooltip title={row.provision_status === 'active' ? 'Re-provision tunnel' : 'Provision tunnel'}>
            <span>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); void handleProvision(row); }}
                disabled={provisioning[row.sync_server_id] || row.provision_status === 'provisioning'}
              >
                {provisioning[row.sync_server_id] ? <CircularProgress size={16} /> : <CloudIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        ),
      },
      {
        key: 'connect',
        label: '',
        align: 'center',
        render: (_v, row) => row.tunnel_url ? (
          <Tooltip title="Open sync server dashboard">
            <IconButton size="small" component="a" href={row.tunnel_url} target="_blank" rel="noopener noreferrer" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null,
      },
      {
        key: 'check',
        label: '',
        align: 'center',
        render: (_v, row) => (
          <Tooltip title={row.tunnel_url ? 'Check online status' : 'No tunnel URL'}>
            <span>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); void checkStatus(row); }}
                disabled={onlineStatuses[row.sync_server_id] === 'checking' || !row.tunnel_url}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ),
      },
    ];

    return [...cols, onlineCol, ...actionCols];
  }, [baseList.columns, onlineStatuses, provisioning, checkStatus, handleProvision]);

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" px={2} pt={2}>
        <Button
          variant="outlined"
          onClick={checkAll}
          disabled={baseList.loading || baseList.data.length === 0 || checkingAll}
          startIcon={checkingAll ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
        >
          Check All Status
        </Button>
      </Box>
      <BaseList
        title="Sync Servers"
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        data={baseList.data}
        columns={columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No sync servers found."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        pagination={baseList.pagination}
      />
    </Box>
  );
};
