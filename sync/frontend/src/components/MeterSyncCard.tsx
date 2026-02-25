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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import { meterSyncApi } from '../api/services';

interface MeterSyncStatus {
  last_sync_at: string | null;
  last_sync_success: boolean | null;
  last_sync_error: string | null;
  inserted_count: number;
  updated_count: number;
  deleted_count: number;
  meter_count: number;
  is_syncing: boolean;
}

export default function MeterSyncCard() {
  const [status, setStatus] = useState<MeterSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const data = await meterSyncApi.getStatus();
      setStatus(data);
      setMessage(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meter sync status';
      console.error('Error fetching meter sync status:', err);
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeterSyncTrigger = async () => {
    try {
      setIsSyncing(true);
      setMessage(null);
      await meterSyncApi.triggerSync();
      setMessage('Meter sync triggered successfully');
      // Refresh status after a short delay
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger meter sync';
      setMessage(`Error: ${errorMessage}`);
      console.error('Error triggering meter sync:', err);
      fetchStatus();
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll for status updates every 30 seconds
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
          <Alert severity="error">Failed to load meter sync status</Alert>
        </CardContent>
      </Card>
    );
  }

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
              {status.last_sync_success !== false ? (
                <CheckCircleIcon color="success" fontSize="large" />
              ) : (
                <ErrorIcon color="error" fontSize="large" />
              )}
              <Box>
                <Typography variant="h6">Remote Meter Sync</Typography>
                <Chip
                  icon={status.last_sync_success !== false ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={status.last_sync_success !== false ? 'Healthy' : 'Failed'}
                  color={status.last_sync_success !== false ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={isSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
              onClick={handleMeterSyncTrigger}
              disabled={isSyncing}
              size="small"
            >
              {isSyncing ? 'Syncing...' : 'Trigger Meter Sync'}
            </Button>
          </Box>

          {status.last_sync_error && status.last_sync_success === false && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {status.last_sync_error}
            </Alert>
          )}

          {/* Last Sync Info */}
          {status.last_sync_at && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom>
                Last Sync
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {new Date(status.last_sync_at).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={status.last_sync_success ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={status.last_sync_success ? 'Success' : 'Failed'}
                    color={status.last_sync_success ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Sync Results */}
          {status.last_sync_at && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom>
                Last Sync Results
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Inserted
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {status.inserted_count}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Updated
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {status.updated_count}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Deleted
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {status.deleted_count}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Meter Count */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom>
              Meter Count
            </Typography>
            <Typography variant="h4" color="primary">
              {status.meter_count}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              meters in local database
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
