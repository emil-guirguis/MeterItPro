import React, { useEffect, useState } from 'react';
import { Box, IconButton, MenuItem, TextField, Tooltip } from '@mui/material';
import UsbIcon from '@mui/icons-material/Usb';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useAdminSyncServersEnhanced, type AdminSyncServerEntity } from './adminSyncServersStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface AdminSyncServerFormProps {
  syncServer?: AdminSyncServerEntity;
  isNew: boolean;
  onCancel: () => void;
}

/**
 * Writes server.conf to the autoinstall folder of a USB drive the operator
 * picks, using the File System Access API (Chromium desktop only). The Linux
 * installer reads this file at first boot so the operator never hand-types the
 * Sync Server ID / Bootstrap Key.
 */
async function writeConfigToUsb(serverId: number, key: string): Promise<void> {
  const picker = (window as any).showDirectoryPicker;
  if (typeof picker !== 'function') {
    alert('Writing to USB needs Chrome or Edge on desktop. Otherwise copy the values manually.');
    return;
  }
  try {
    const root = await picker({ mode: 'readwrite' });
    // Always land server.conf in the USB's autoinstall folder — user-data copies
    // /cdrom/autoinstall/server.conf onto the installed system. The operator just
    // picks the drive root; if they happen to pick the autoinstall folder itself
    // we use it directly instead of nesting another autoinstall under it.
    const dir = root.name === 'autoinstall'
      ? root
      : await root.getDirectoryHandle('autoinstall', { create: true });
    const handle = await dir.getFileHandle('server.conf', { create: true });
    const writable = await handle.createWritable();
    await writable.write(`SYNC_SERVER_ID=${serverId}\nSYNC_SERVER_BOOTSTRAP_KEY=${key}\n`);
    await writable.close();
    alert('Config written to USB (autoinstall/server.conf). Boot the new server from this stick.');
  } catch (e: any) {
    if (e?.name === 'AbortError') return; // user cancelled the picker
    alert('Failed to write config to USB: ' + (e?.message ?? e));
  }
}

/**
 * Admin sync server form — fully schema-driven via BaseForm.
 * Custom-rendered fields:
 *  - tenant: a tenant picker in create mode, a read-only label in edit mode.
 *  - bootstrap_key: read-only value plus a "write config to USB" disk button
 *    (enabled once the server is provisioned/active).
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
      renderCustomField={(fieldName, fieldDef, value, error, _isDisabled, onChange) => {
        if (fieldName === 'tenant_id') {
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
        }

        if (fieldName === 'bootstrap_key' && value) {
          const isActive = syncServer?.provision_status === 'active';
          return (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                label={fieldDef.label}
                value={String(value)}
                multiline
                rows={2}
                InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                fullWidth
                helperText={isActive
                  ? 'Insert the installer USB, click the disk icon, and select the USB drive.'
                  : 'Provision the server before writing config to USB.'}
              />
              <Tooltip title={isActive ? 'Write config to USB' : 'Provision first'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={!isActive || !syncServer?.sync_server_id}
                    onClick={() => writeConfigToUsb(syncServer!.sync_server_id, String(value))}
                  >
                    <UsbIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          );
        }

        return null;
      }}
    />
  );
};
