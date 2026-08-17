import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CloudIcon from '@mui/icons-material/Cloud';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { BaseForm } from '@meterit/framework-frontend/components/form/BaseForm';
import { useValidationDataProvider } from '../../hooks/useValidationDataProvider';
import { useSyncServersEnhanced } from './syncServersStore';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'default',
  provisioning: 'info',
  active: 'success',
  error: 'error',
};

interface SyncServerFormProps {
  server?: any;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const SyncServerForm: React.FC<SyncServerFormProps> = ({
  server,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const store = useSyncServersEnhanced();
  const baseValidationDataProvider = useValidationDataProvider();
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

  return (
    <BaseForm
      schemaName="sync_server"
      entity={server}
      store={store}
      onCancel={onCancel}
      onSubmit={onSubmit}
      loading={loading}
      showTabs={true}
      validationDataProvider={validationDataProvider}
      renderCustomField={(fieldName, fieldDef, value, _error, _isDisabled, onChange) => {
        if (fieldName === 'provision_status') {
          const isProvisioning = value === 'provisioning';
          const isActive = value === 'active';
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                label={isProvisioning ? 'provisioning…' : (value || 'pending')}
                color={STATUS_COLORS[value] ?? 'default'}
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              />
              {!isActive && server?.sync_server_id && (
                <Tooltip title={value === 'error' ? `Re-provision tunnel` : 'Provision Cloudflare tunnel'}>
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={isProvisioning}
                      startIcon={isProvisioning ? <CircularProgress size={14} /> : <CloudIcon fontSize="small" />}
                      onClick={() => store.provisionServer(String(server.sync_server_id))}
                    >
                      {isProvisioning ? 'Provisioning…' : value === 'error' ? 'Re-provision' : 'Provision'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>
          );
        }

        if (fieldName === 'tunnel_url') {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label={fieldDef.label}
                value={value || ''}
                InputProps={{
                  readOnly: true,
                  endAdornment: value ? (
                    <Tooltip title="Open in new tab">
                      <IconButton size="small" component="a" href={value} target="_blank" rel="noopener noreferrer">
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : undefined,
                }}
                fullWidth
                placeholder="Not yet provisioned"
              />
            </Box>
          );
        }

        if (fieldName === 'bootstrap_key' && value) {
          const envBlock = `SYNC_SERVER_ID=${server?.sync_server_id}\nSYNC_SERVER_BOOTSTRAP_KEY=${value}`;
          return (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                label={fieldDef.label}
                value={envBlock}
                multiline
                rows={4}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace', fontSize: 12 },
                }}
                fullWidth
              />
              <Tooltip title="Copy">
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(envBlock)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        }

        return null;
      }}
    />
  );
};

export default SyncServerForm;
