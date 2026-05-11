import React, { useMemo, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { BaseList } from '@framework/components/list/BaseList';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { ColumnDefinition } from '@framework/components/list/types/ui';
import { useTenantsEnhanced, type TenantEntity } from './tenantsStore';
import { impersonateTenant } from './adminService';
import { tokenStorage } from '../utils/tokenStorage';
import { authService } from '../services/authService';

interface TenantListProps {
  onEdit?: (tenant: TenantEntity) => void;
  onCreate?: () => void;
}

const allowedAuth = { checkPermission: () => true as boolean, user: undefined };

export const TenantList: React.FC<TenantListProps> = ({ onEdit, onCreate }) => {
  const tenants = useTenantsEnhanced();
  const { schema } = useSchema('tenant');
  const [connecting, setConnecting] = useState<number | null>(null);
  const [connectError, setConnectError] = useState('');

  const handleConnect = async (tenant: TenantEntity) => {
    setConnecting(tenant.tenant_id);
    setConnectError('');
    try {
      const currentTokenData = tokenStorage.getTokenData();
      if (currentTokenData) {
        sessionStorage.setItem('admin_portal_backup', JSON.stringify(currentTokenData));
      }
      const result = await impersonateTenant(tenant.tenant_id);
      authService.storeTokens(result.token, '', result.expiresIn);
      authService.clearLogoutFlag();
      window.location.href = '/dashboard';
    } catch (err) {
      sessionStorage.removeItem('admin_portal_backup');
      setConnectError(err instanceof Error ? err.message : 'Failed to connect');
      setConnecting(null);
    }
  };

  const schemaColumns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<TenantEntity>(schema.formFields, {
      fieldOrder: ['name', 'contactEmail', 'url', 'active'],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  const connectColumn: ColumnDefinition<TenantEntity> = useMemo(() => ({
    key: 'connect',
    label: '',
    align: 'right',
    render: (_value: unknown, item: TenantEntity) => (
      <Button
        variant="contained"
        size="small"
        disabled={!item.active || connecting !== null}
        onClick={(e) => { e.stopPropagation(); void handleConnect(item); }}
      >
        {connecting === item.tenant_id
          ? <CircularProgress size={14} color="inherit" />
          : 'Connect'}
      </Button>
    ),
  }), [connecting]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(() => [...schemaColumns, connectColumn], [schemaColumns, connectColumn]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const baseList = useBaseList<TenantEntity, ReturnType<typeof useTenantsEnhanced>>({
    entityName: 'tenant',
    entityNamePlural: 'tenants',
    useStore: useTenantsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: false,
      allowBulkActions: false,
      allowExport: false,
      allowSearch: true,
      allowFilters: true,
    },
    columns,
    filters,
    onEdit,
    onCreate,
    authContext: allowedAuth,
  });

  return (
    <div className="tenant-list">
      {connectError && (
        <div style={{ color: 'red', padding: '8px 0', fontSize: 14 }}>{connectError}</div>
      )}
      <BaseList
        title="Clients"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No clients found. Create your first client to get started."
        onEdit={baseList.handleEdit}
        pagination={baseList.pagination}
      />
    </div>
  );
};
