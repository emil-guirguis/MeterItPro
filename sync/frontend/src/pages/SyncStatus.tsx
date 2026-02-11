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
import { syncApi, tenantApi } from '../api/services';
import CompanyInfoCard from '../components/CompanyInfoCard';
import BACnetMeterReadingCard from '../components/BACnetMeterReadingCard';
import MeterSyncCard from '../components/MeterSyncCard';

// 17 minutes polling interval (17 * 60 * 1000 = 1,020,000 ms)
const POLLING_INTERVAL = 17 * 60 * 1000;

export default function SyncStatus() {
  const { syncStatus, setSyncStatus, tenantInfo, setTenantInfo, setError } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSyncStatus = async () => {
    try {
      // First, try to fetch tenant data
      let currentTenant = null;
      try {
        const tenantData = await tenantApi.getTenantInfo();
        setTenantInfo(tenantData);
        currentTenant = tenantData;
      } catch (err) {
        console.warn('Could not fetch tenant info:', err);
        // If no tenant exists, don't fetch other data
        setLastUpdate(new Date());
        setError(null);
        return;
      }

      // Only fetch sync status if tenant exists
      if (currentTenant) {
        const status = await syncApi.getStatus();
        setSyncStatus(status);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sync status';
      setError(errorMessage);
      console.error('Error fetching sync status:', err);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchSyncStatus();
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchSyncStatus().finally(() => setIsLoading(false));

    // Poll every 17 minutes
    const interval = setInterval(fetchSyncStatus, POLLING_INTERVAL);

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
        <Typography variant="h4">Sync Status</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {lastUpdate && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh data">
            <span>
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                color="primary"
              >
                {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

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

        {/* BACnet and Meter Sync Cards - Only show if tenant is connected */}
        {tenantInfo && (
          <>
            <Grid item xs={12}>
              <MeterSyncCard />
            </Grid>

            <Grid item xs={12}>
              <BACnetMeterReadingCard />
            </Grid>
          </>
        )}
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
