import React, { useEffect, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useAdminSyncServersEnhanced, type AdminSyncServerEntity } from './adminSyncServersStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface AdminSyncServerFormProps {
  syncServer?: AdminSyncServerEntity;
  isNew: boolean;
  onCancel: () => void;
}

/**
 * Admin sync server form — fully schema-driven via BaseForm.
 * Only the tenant field is custom-rendered: a tenant picker in create mode,
 * a read-only label in edit mode (tenant is immutable once provisioned).
 */
export const AdminSyncServerForm: React.FC<AdminSyncServerFormProps> = ({ syncServer, isNew, onCancel }) => {
  const store = useAdminSyncServersEnhanced();
  const [tenants, setTenants] = useState<Array<{ tenant_id: number; name: string }>>([]);

  useEffect(() => {
    if (!isNew) return;
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    fetch(`${API_BASE_URL}/admin/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTenants(d.data?.items ?? []))
      .catch(() => { /* ignore */ });
  }, [isNew]);

  return (
    <BaseForm
      schemaName="admin_sync_server"
      entity={syncServer}
      store={store}
      onCancel={onCancel}
      showTabs={true}
      renderCustomField={(fieldName, _fieldDef, value, error, _isDisabled, onChange) => {
        if (fieldName !== 'tenant_id') return null;

        // Edit mode: tenant is fixed
        if (!isNew) {
          return (
            <TextField label="Tenant" value={syncServer?.tenant_name ?? ''} fullWidth disabled />
          );
        }

        // Create mode: tenant picker
        return (
          <TextField
            select label="Tenant" required fullWidth
            value={value ?? ''}
            error={!!error}
            helperText={error}
            onChange={e => onChange(Number(e.target.value))}
          >
            {tenants.map(t => (
              <MenuItem key={t.tenant_id} value={t.tenant_id}>{t.name}</MenuItem>
            ))}
          </TextField>
        );
      }}
    />
  );
};
