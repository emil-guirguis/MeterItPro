import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Collapse, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, IconButton, Paper, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import { FormField } from '@framework/components/formfield/FormField';
import { TIMEZONE_OPTIONS } from '@framework/components/formfield/fieldOptions';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WifiIcon from '@mui/icons-material/Wifi';
import CloudIcon from '@mui/icons-material/Cloud';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { useSyncServerStore } from '../../store/entities/syncServerStore';
import type { SyncServer, SyncServerFormData } from '../../types/entities';

const EMPTY_FORM: SyncServerFormData = {
  name: '', timezone: 'UTC', api_key: '', active: true,
  client_api_url: 'https://meteritpro.com/api', github_owner: '',
  remote_db_host: '', remote_db_port: 5432, remote_db_name: '',
  remote_db_user: '', remote_db_password: '',
};

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'default',
  provisioning: 'info',
  active: 'success',
  error: 'error',
};

function SetupInstructions({ server }: { server: SyncServer }) {
  const [open, setOpen] = useState(false);
  const copyLine = (text: string) => navigator.clipboard.writeText(text);

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        variant="text"
        onClick={() => setOpen((v) => !v)}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      >
        Setup Instructions
      </Button>
      <Collapse in={open}>
        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Add these two variables to your sync server <code>.env</code> file, then run{' '}
            <code>docker compose up -d</code>. The provisioner will start cloudflared automatically.
          </Typography>
          {[
            `SYNC_SERVER_ID=${server.sync_server_id}`,
            `SYNC_SERVER_BOOTSTRAP_KEY=${server.bootstrap_key}`,
          ].map((line) => (
            <Box
              key={line}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'monospace', fontSize: 13, mb: 0.5 }}
            >
              <code style={{ flex: 1, background: '#e8e8e8', padding: '2px 6px', borderRadius: 4 }}>{line}</code>
              <Tooltip title="Copy">
                <IconButton size="small" onClick={() => copyLine(line)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Paper>
      </Collapse>
    </Box>
  );
}

const SyncServersPanel: React.FC = () => {
  const {
    servers, loading, error,
    fetchServers, createServer, updateServer, deleteServer, provisionServer, testConnection, clearError,
  } = useSyncServerStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SyncServer | null>(null);
  const [form, setForm] = useState<SyncServerFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<SyncServer | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string } | null>>({});
  const [testingId, setTestingId] = useState<number | null>(null);
  const [provisioningId, setProvisioningId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => { fetchServers(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setDialogOpen(true);
  };

  const openEdit = (server: SyncServer) => {
    setEditTarget(server);
    setForm({
      name: server.name, timezone: server.timezone, api_key: server.api_key, active: server.active,
      client_api_url: server.client_api_url || 'https://meteritpro.com/api',
      github_owner: server.github_owner || '',
      remote_db_host: server.remote_db_host || '', remote_db_port: server.remote_db_port || 5432,
      remote_db_name: server.remote_db_name || '', remote_db_user: server.remote_db_user || '',
      remote_db_password: server.remote_db_password || '',
    });
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      if (editTarget) {
        await updateServer(editTarget.sync_server_id, form);
      } else {
        await createServer(form);
      }
      setDialogOpen(false);
    } catch (err: any) {
      setSaveError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteServer(deleteTarget.sync_server_id);
    setDeleteTarget(null);
  };

  const handleProvision = async (server: SyncServer) => {
    setProvisioningId(server.sync_server_id);
    try {
      await provisionServer(server.sync_server_id);
    } finally {
      setProvisioningId(null);
    }
  };

  const handleTestConnection = async (server: SyncServer) => {
    setTestingId(server.sync_server_id);
    const result = await testConnection(server.sync_server_id);
    setTestResults((prev) => ({ ...prev, [server.sync_server_id]: result }));
    setTestingId(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Each sync server gets its own Cloudflare Tunnel — no public IP required.
          Configure Cloudflare credentials in the <strong>Cloudflare</strong> settings tab first.
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
          Add Sync Server
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {loading && servers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : servers.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>No sync servers configured.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Timezone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tunnel</TableCell>
              <TableCell>Connection</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {servers.map((srv) => {
              const testResult = testResults[srv.sync_server_id];
              const isProvisioning = provisioningId === srv.sync_server_id || srv.provision_status === 'provisioning';
              return (
                <React.Fragment key={srv.sync_server_id}>
                  <TableRow hover>
                    <TableCell>{srv.name}</TableCell>
                    <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {srv.tunnel_url || '—'}
                    </TableCell>
                    <TableCell>{srv.timezone}</TableCell>
                    <TableCell>
                      <Chip
                        label={srv.active ? 'Active' : 'Inactive'}
                        color={srv.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={isProvisioning ? 'provisioning…' : srv.provision_status}
                          color={STATUS_COLORS[srv.provision_status] ?? 'default'}
                          size="small"
                        />
                        {srv.provision_status !== 'active' && (
                          <Tooltip title={srv.provision_status === 'error' ? `Re-provision: ${srv.provision_error}` : 'Provision Tunnel'}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleProvision(srv)}
                                disabled={isProvisioning}
                              >
                                {isProvisioning ? <CircularProgress size={16} /> : <CloudIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {testResult && (
                        <Chip
                          label={testResult.success ? 'Online' : testResult.message}
                          color={testResult.success ? 'success' : 'error'}
                          size="small"
                          sx={{ maxWidth: 140 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Open Site">
                        <span>
                          <IconButton
                            size="small"
                            disabled={!srv.tunnel_url}
                            onClick={() => window.open(srv.tunnel_url, '_blank', 'noopener,noreferrer')}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Test Connection">
                        <span>
                          <IconButton
                            size="small"
                            disabled={testingId === srv.sync_server_id || !srv.tunnel_url}
                            onClick={() => handleTestConnection(srv)}
                          >
                            {testingId === srv.sync_server_id ? <CircularProgress size={16} /> : <WifiIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(srv)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(srv)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  {srv.provision_status === 'active' && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ pb: 2, pt: 0, borderBottom: 'none' }}>
                        <SetupInstructions server={srv} />
                      </TableCell>
                    </TableRow>
                  )}
                  {srv.provision_status === 'error' && srv.provision_error && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ pt: 0, borderBottom: 'none' }}>
                        <Alert severity="error" sx={{ py: 0 }}>{srv.provision_error}</Alert>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Sync Server' : 'Add Sync Server'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <FormField
            name="name"
            label="Name"
            value={form.name}
            onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g. Office Building"
          />
          <FormField
            name="timezone"
            type="timezone"
            label="Timezone"
            value={form.timezone}
            options={TIMEZONE_OPTIONS}
            onChange={(e: any) => setForm({ ...form, timezone: e.target.value })}
          />
          <FormField
            name="api_key"
            type="password"
            label="API Key (optional)"
            value={form.api_key}
            onChange={(e: any) => setForm({ ...form, api_key: e.target.value })}
          />
          <FormControlLabel
            control={<Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />}
            label="Active"
          />

          <Accordion disableGutters elevation={0} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight={500}>Connection Settings (for installer)</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormField
                name="client_api_url"
                type="url"
                label="Client API URL"
                value={form.client_api_url}
                onChange={(e: any) => setForm({ ...form, client_api_url: e.target.value })}
                placeholder="https://meteritpro.com/api"
              />
              <FormField
                name="github_owner"
                label="GitHub Owner"
                value={form.github_owner}
                onChange={(e: any) => setForm({ ...form, github_owner: e.target.value })}
                placeholder="your-github-username-or-org"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                Remote Database — used by the sync server to push readings to the client DB
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 3 }}>
                  <FormField
                    name="remote_db_host"
                    label="DB Host"
                    value={form.remote_db_host}
                    onChange={(e: any) => setForm({ ...form, remote_db_host: e.target.value })}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormField
                    name="remote_db_port"
                    type="number"
                    label="Port"
                    value={form.remote_db_port}
                    onChange={(e: any) => setForm({ ...form, remote_db_port: Number(e.target.value) })}
                  />
                </Box>
              </Box>
              <FormField
                name="remote_db_name"
                label="DB Name"
                value={form.remote_db_name}
                onChange={(e: any) => setForm({ ...form, remote_db_name: e.target.value })}
              />
              <FormField
                name="remote_db_user"
                label="DB User"
                value={form.remote_db_user}
                onChange={(e: any) => setForm({ ...form, remote_db_user: e.target.value })}
              />
              <FormField
                name="remote_db_password"
                type="password"
                label="DB Password"
                value={form.remote_db_password}
                onChange={(e: any) => setForm({ ...form, remote_db_password: e.target.value })}
              />
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading || !form.name}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete Sync Server</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.name}</strong>?
            {deleteTarget?.tunnel_id && ' This will also remove the Cloudflare tunnel and DNS record.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SyncServersPanel;
