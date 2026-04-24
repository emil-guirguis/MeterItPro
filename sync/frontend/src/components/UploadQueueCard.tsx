import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import { uploadQueueApi } from '../api/services';

interface UploadQueueStatus {
  is_running: boolean;
  last_upload_time: string | null;
  last_upload_success: boolean | null;
  last_upload_error: string | null;
  queue_size: number;
  total_uploaded: number;
  total_failed: number;
  is_client_connected: boolean;
}

interface UploadOperation {
  sync_operation_id: number;
  operation_type: string;
  readings_count: number;
  success: boolean;
  error_message: string | null;
  details: string | null;
  created_at: string;
}

const OPERATION_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' }> = {
  upload:                          { label: 'Upload',            color: 'primary' },
  sync:                            { label: 'Upload',            color: 'primary' },
  meter_connect:                   { label: 'Meter Connect',     color: 'info' },
  meter_read:                      { label: 'Meter Read',        color: 'success' },
  collection_cycle:                { label: 'Collection Cycle',  color: 'warning' },
  remote_download_tenant:          { label: 'Download Tenant',   color: 'secondary' },
  remote_download_meter:           { label: 'Download Meters',   color: 'secondary' },
  remote_download_register:        { label: 'Download Registers', color: 'secondary' },
  remote_download_device_register: { label: 'Download DevRegs',  color: 'secondary' },
};

function parseDetails(details: string | null): string {
  if (!details) return '';
  try {
    const d = JSON.parse(details);
    const parts: string[] = [];
    if (d.name)      parts.push(d.name);
    if (d.ip)        parts.push(d.ip);
    if (d.inserted !== undefined) parts.push(`ins:${d.inserted}`);
    if (d.updated  !== undefined) parts.push(`upd:${d.updated}`);
    if (d.deleted  !== undefined) parts.push(`del:${d.deleted}`);
    if (d.skipped  !== undefined) parts.push(`skip:${d.skipped}`);
    if (d.metersProcessed !== undefined) parts.push(`meters:${d.metersProcessed}`);
    if (d.readingsCollected !== undefined) parts.push(`readings:${d.readingsCollected}`);
    if (d.batches  !== undefined) parts.push(`batches:${d.batches}`);
    if (d.failed   !== undefined && d.failed > 0) parts.push(`failed:${d.failed}`);
    return parts.join(' · ');
  } catch {
    return '';
  }
}

export default function UploadQueueCard() {
  const [status, setStatus] = useState<UploadQueueStatus | null>(null);
  const [operations, setOperations] = useState<UploadOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const [statusData, logData] = await Promise.all([
        uploadQueueApi.getStatus(),
        uploadQueueApi.getLog(),
      ]);
      setStatus(statusData);
      setOperations(logData);
      setMessage(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch upload queue status';
      console.error('Error fetching upload queue status:', err);
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerUpload = async () => {
    try {
      setIsUploading(true);
      setMessage(null);
      await uploadQueueApi.triggerUpload();
      setMessage('Upload triggered successfully');
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger upload';
      setMessage(`Error: ${errorMessage}`);
      console.error('Error triggering upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !status) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">Failed to load upload queue status</Alert>
        </CardContent>
      </Card>
    );
  }

  const nextUploadTime = status.last_upload_time
    ? new Date(new Date(status.last_upload_time).getTime() + 5 * 60 * 1000)
    : null;

  return (
    <>
      {message && (
        <Alert
          severity={message.startsWith('Error') ? 'error' : 'success'}
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              {status.is_client_connected ? (
                <CheckCircleIcon color="success" fontSize="large" />
              ) : (
                <ErrorIcon color="error" fontSize="large" />
              )}
              <Box>
                <Typography variant="h6">Upload to Remote</Typography>
                <Chip
                  icon={status.is_client_connected ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={status.is_client_connected ? 'Connected' : 'Disconnected'}
                  color={status.is_client_connected ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              onClick={handleTriggerUpload}
              disabled={isUploading || status.is_running}
              size="small"
            >
              {isUploading ? 'Uploading...' : 'Upload Now'}
            </Button>
          </Box>

          {status.last_upload_error && status.last_upload_success === false && (
            <Alert severity="error" sx={{ mb: 2 }}>{status.last_upload_error}</Alert>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom>Queue</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Pending Upload</Typography>
                <Typography variant="h6" color="primary">{status.queue_size}</Typography>
                <Typography variant="caption" color="text.secondary">readings waiting to upload</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Uploaded</Typography>
                <Typography variant="h6" color="success.main">{status.total_uploaded}</Typography>
                <Typography variant="caption" color="text.secondary">readings successfully uploaded</Typography>
              </Box>
            </Box>
          </Box>

          {status.last_upload_time && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom>Last Upload</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{new Date(status.last_upload_time).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    icon={status.last_upload_success ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={status.last_upload_success ? 'Success' : 'Failed'}
                    color={status.last_upload_success ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          )}

          {nextUploadTime && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom>Next Scheduled Upload</Typography>
              <Typography variant="body1">{nextUploadTime.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">(scheduled every 5 minutes)</Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom>Remote Connection</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              {status.is_client_connected ? (
                <>
                  <CheckCircleIcon color="success" />
                  <Typography variant="body2">Connected to remote server</Typography>
                </>
              ) : (
                <>
                  <ErrorIcon color="error" />
                  <Typography variant="body2">Disconnected from remote server</Typography>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {operations.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Activity Log</Typography>
              <Button
                size="small"
                startIcon={isLoading ? <CircularProgress size={14} /> : <RefreshIcon />}
                onClick={fetchStatus}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Details / Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {operations.map((op) => {
                    const opMeta = OPERATION_LABELS[op.operation_type] ?? { label: op.operation_type ?? 'Unknown', color: 'default' as const };
                    const detailStr = parseDetails(op.details);
                    return (
                      <TableRow key={op.sync_operation_id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(op.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip label={opMeta.label} color={opMeta.color} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{op.readings_count ?? '-'}</TableCell>
                        <TableCell>
                          <Chip
                            icon={op.success ? <CheckCircleIcon /> : <ErrorIcon />}
                            label={op.success ? 'OK' : 'Fail'}
                            color={op.success ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {op.error_message ? (
                            <Typography variant="caption" color="error">{op.error_message}</Typography>
                          ) : detailStr ? (
                            <Typography variant="caption" color="text.secondary">{detailStr}</Typography>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
