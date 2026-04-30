import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppStore } from '../stores/useAppStore';
import { localSyncApi, tenantApi } from '../api/services';
import CompanyInfoCard from '../components/CompanyInfoCard';
import MeterCollectionCard from '../components/MeterCollectionCard';
import MeterDeviceStatusCard from '../components/MeterDeviceStatusCard';
import RemoteMeterSyncCard from '../components/RemoteMeterSyncCard';
import UploadQueueCard from '../components/UploadQueueCard';

const POLLING_INTERVAL = 17 * 60 * 1000;

export default function SystemStatusPage() {
  const { syncStatus, setSyncStatus, tenantInfo, setTenantInfo, setError } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const [tenantResult, statusResult] = await Promise.allSettled([
        tenantApi.getTenantInfo(),
        localSyncApi.getStatus(),
      ]);

      if (tenantResult.status === 'fulfilled') {
        setTenantInfo(tenantResult.value);
      } else {
        console.warn('Could not fetch tenant info:', tenantResult.reason);
      }

      if (statusResult.status === 'fulfilled') {
        setSyncStatus(statusResult.value);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch system status';
      setError(errorMessage);
      console.error('Error fetching system status:', err);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchStatus();
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchStatus().finally(() => setIsLoading(false));
    const interval = setInterval(fetchStatus, POLLING_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Typography variant="h4">System Status</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {lastUpdate && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh data">
            <span>
              <IconButton onClick={handleRefresh} disabled={isLoading} color="primary">
                {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <CompanyInfoCard />
        </Grid>

        {/* Readings Pending Upload card */}
        {tenantInfo && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Readings Pending Upload
                </Typography>
                <Typography variant="h3" color="primary">
                  {syncStatus?.queue_size || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  readings waiting to be uploaded to remote
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {tenantInfo && (
          <>
            <Grid item xs={12}>
              <MeterDeviceStatusCard />
            </Grid>
            <Grid item xs={12}>
              <UploadQueueCard />
            </Grid>

            <Grid item xs={12}>
              <RemoteMeterSyncCard />
            </Grid>

            <Grid item xs={12}>
              <MeterCollectionCard />
            </Grid>


          </>
        )}
      </Grid>

      {tenantInfo && syncStatus?.sync_errors && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Upload Errors
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
                        <TableCell>{new Date(error.synced_at).toLocaleString()}</TableCell>
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
              <Alert severity="success">No upload errors in recent history</Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
