import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { useAppStore } from '../stores/useAppStore';
import { syncApi, tenantApi, meterSyncApi } from '../api/services';
import CompanyInfoCard from '../components/CompanyInfoCard';
import BACnetMeterReadingCard from '../components/BACnetMeterReadingCard';
import MeterSyncCard from '../components/MeterSyncCard';
import { MeterSyncStatus } from '../types';

const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL || '500000');

interface SyncMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

export default function SyncStatus() {
  const { syncStatus, setSyncStatus, tenantInfo, setTenantInfo, setError } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMeterSyncing, setIsMeterSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [syncMessage, setSyncMessage] = useState<SyncMessage | null>(null);
  const [meterSyncStatus, setMeterSyncStatus] = useState<MeterSyncStatus | null>(null);
  const [meterSyncMessage, setMeterSyncMessage] = useState<SyncMessage | null>(null);

  const fetchSyncStatus = async () => {
    try {
      const status = await syncApi.getStatus();
      setSyncStatus(status);

      // Try to fetch tenant data (non-blocking)
      try {
        const tenantData = await tenantApi.getTenantInfo();
        setTenantInfo(tenantData);
      } catch (err) {
        console.warn('Could not fetch tenant info during polling:', err);
      }

      // Try to fetch meter sync status (non-blocking)
      try {
        const meterStatus = await meterSyncApi.getStatus();
        setMeterSyncStatus(meterStatus);
      } catch (err) {
        console.warn('Could not fetch meter sync status:', err);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sync status';
      setError(errorMessage);
      console.error('Error fetching sync status:', err);
    }
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      await syncApi.triggerSync();
      setSyncMessage({ text: 'Sync triggered successfully', type: 'success' });
      setTimeout(fetchSyncStatus, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger sync';
      setSyncMessage({ text: `Failed to trigger sync: ${errorMessage}`, type: 'error' });
      console.error('Error triggering sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMeterSyncTrigger = async () => {
    try {
      setIsMeterSyncing(true);
      setMeterSyncMessage(null);
      await meterSyncApi.triggerSync();
      setMeterSyncMessage({ text: 'Meter sync triggered successfully', type: 'success' });
      setTimeout(fetchSyncStatus, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger meter sync';
      setMeterSyncMessage({ text: `Failed to trigger meter sync: ${errorMessage}`, type: 'error' });
      console.error('Error triggering meter sync:', err);
    } finally {
      setIsMeterSyncing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchSyncStatus().finally(() => setIsLoading(false));

    const interval = setInterval(fetchSyncStatus, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !syncStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sync Status</Typography>
        {lastUpdate && (
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {syncMessage && (
        <Alert
          severity={syncMessage.type}
          sx={{ mb: 3 }}
          onClose={() => setSyncMessage(null)}
        >
          {syncMessage.text}
        </Alert>
      )}

      {meterSyncMessage && (
        <Alert
          severity={meterSyncMessage.type}
          sx={{ mb: 3 }}
          onClose={() => setMeterSyncMessage(null)}
        >
          {meterSyncMessage.text}
        </Alert>
      )}

      {/* Company Info Card - Always show */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <CompanyInfoCard />
        </Grid>

        {/* Sync Queue Card - Show if tenant is connected */}
        {tenantInfo && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sync Queue
                </Typography>
                <Typography variant="h3" color="primary">
                  {syncStatus?.queue_size || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  readings pending synchronization
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Last Successful Sync Card - Show if tenant is connected */}
        {tenantInfo && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Last Successful Sync
                </Typography>
                {syncStatus?.last_sync_at ? (
                  <>
                    <Typography variant="body1">
                      {new Date(syncStatus.last_sync_at).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getTimeSince(new Date(syncStatus.last_sync_at))}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No successful sync yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Manual Sync Card - Show if tenant is connected */}
        {tenantInfo && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Manual Sync
                </Typography>
                <Button
                  variant="contained"
                  startIcon={isSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
                  onClick={handleManualSync}
                  disabled={isSyncing || !syncStatus?.is_connected}
                  fullWidth
                >
                  {isSyncing ? 'Syncing...' : 'Trigger Sync Now'}
                </Button>
                {!syncStatus?.is_connected && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Manual sync is disabled when Client System is unreachable
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Meter Sync Cards - Show if tenant is connected */}
        {tenantInfo && meterSyncStatus && (
          <>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Last Meter Sync
                  </Typography>
                  {meterSyncStatus.last_sync_at ? (
                    <>
                      <Typography variant="body1">
                        {new Date(meterSyncStatus.last_sync_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getTimeSince(new Date(meterSyncStatus.last_sync_at))}
                      </Typography>
                      {meterSyncStatus.last_sync_success === false && meterSyncStatus.last_sync_error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {meterSyncStatus.last_sync_error}
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No meter sync yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Meter Count
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {meterSyncStatus.meter_count ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    meters in local database
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Last Meter Sync Results
                  </Typography>
                  {meterSyncStatus.last_sync_at ? (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Inserted
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {meterSyncStatus.inserted_count}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Updated
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          {meterSyncStatus.updated_count}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Deleted
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {meterSyncStatus.deleted_count}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No sync results yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Manual Meter Sync
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={isMeterSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
                    onClick={handleMeterSyncTrigger}
                    disabled={isMeterSyncing}
                    fullWidth
                  >
                    {isMeterSyncing ? 'Syncing Meters...' : 'Trigger Meter Sync Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* BACnet and Meter Sync Cards - Always show */}
        <Grid item xs={12}>
          <MeterSyncCard />
        </Grid>

        <Grid item xs={12}>
          <BACnetMeterReadingCard />
        </Grid>
      </Grid>

      {/* Sync Error Logs - Only show if tenant is connected */}
      {tenantInfo && syncStatus?.sync_errors && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Sync Errors
            </Typography>
            {syncStatus.sync_errors.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Batch Size</TableCell>
                      <TableCell>Error Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {syncStatus.sync_errors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell>
                          {new Date(error.synced_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{error.batch_size}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error">
                            {error.error_message}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success">No sync errors in recent history</Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function getTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
