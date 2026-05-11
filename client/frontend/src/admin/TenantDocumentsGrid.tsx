import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
  Paper, Box, Button, IconButton, TextField, CircularProgress,
  Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  listTenantDocuments, createTenantDocument, updateTenantDocument,
  removeTenantDocument, downloadTenantDocument, type TenantDocument,
} from './adminService';

interface Props { tenantId: number; }

interface NewRow {
  description: string;
  file: File | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const TenantDocumentsGrid: React.FC<Props> = ({ tenantId }) => {
  const [items, setItems]         = useState<TenantDocument[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [newRow, setNewRow]       = useState<NewRow | null>(null);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDesc, setEditDesc]   = useState('');
  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const newRowFileRef             = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listTenantDocuments(tenantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewRow(prev => prev ? { ...prev, file } : null);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!newRow?.file) {
      setToast({ msg: 'Select a file first', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const base64 = await fileToBase64(newRow.file);
      await createTenantDocument(tenantId, {
        description: newRow.description.trim(),
        file_name:   newRow.file.name,
        file_type:   newRow.file.type || 'application/octet-stream',
        file_size:   newRow.file.size,
        file_data:   base64,
      });
      setNewRow(null);
      setToast({ msg: 'Document added', severity: 'success' });
      await load();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Save failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDescBlur = async (item: TenantDocument, newDesc: string) => {
    setEditingId(null);
    if (newDesc === item.description) return;
    try {
      await updateTenantDocument(tenantId, item.tenant_document_id, newDesc);
      setItems(prev => prev.map(d =>
        d.tenant_document_id === item.tenant_document_id ? { ...d, description: newDesc } : d
      ));
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Update failed', severity: 'error' });
      await load();
    }
  };

  const handleDownload = async (item: TenantDocument) => {
    try {
      const { file_name, file_type, file_data } = await downloadTenantDocument(tenantId, item.tenant_document_id);
      const binary = atob(file_data);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: file_type });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Download failed', severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await removeTenantDocument(tenantId, deleteId);
      setDeleteId(null);
      setToast({ msg: 'Document deleted', severity: 'success' });
      await load();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : 'Delete failed', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Box p={3} display="flex" justifyContent="center"><CircularProgress size={24} /></Box>;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
          <Button size="small" onClick={load} sx={{ ml: 1 }}>Retry</Button>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '38%' }}>Description</TableCell>
              <TableCell style={{ width: '37%' }}>Document</TableCell>
              <TableCell style={{ width: '10%' }}>Size</TableCell>
              <TableCell style={{ width: '15%', textAlign: 'right' }}>
                <Button size="small" variant="text" onClick={() => setNewRow({ description: '', file: null })} disabled={!!newRow}>
                  + Document
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {newRow && (
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Description"
                    value={newRow.description}
                    onChange={e => setNewRow(prev => prev ? { ...prev, description: e.target.value } : null)}
                    onKeyDown={e => { if (e.key === 'Escape') setNewRow(null); }}
                    variant="standard"
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      onClick={() => newRowFileRef.current?.click()}
                    >
                      {newRow.file ? newRow.file.name : 'Select File…'}
                    </Button>
                    <input ref={newRowFileRef} type="file" hidden onChange={handleFileSelect} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {newRow.file ? formatBytes(newRow.file.size) : ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" justifyContent="flex-end" gap={0.5}>
                    <IconButton size="small" color="primary" onClick={handleSave} disabled={saving}>
                      {saving ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" onClick={() => setNewRow(null)} disabled={saving}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {items.length === 0 && !newRow && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" py={2}>
                    No documents yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {items.map(item => (
              <TableRow key={item.tenant_document_id} hover>
                <TableCell
                  onClick={() => { setEditingId(item.tenant_document_id); setEditDesc(item.description); }}
                  style={{ cursor: 'text' }}
                >
                  {editingId === item.tenant_document_id ? (
                    <TextField
                      size="small"
                      fullWidth
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      onBlur={() => void handleDescBlur(item, editDesc)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      variant="standard"
                      autoFocus
                    />
                  ) : (
                    item.description || <Typography variant="body2" color="text.secondary" component="span">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>{item.file_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{formatBytes(item.file_size)}</Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" justifyContent="flex-end" gap={0.5}>
                    <IconButton size="small" title="Download" onClick={() => void handleDownload(item)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.tenant_document_id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteId !== null} onClose={() => !deleting && setDeleteId(null)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>Delete this document? This cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={16} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};
