import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useAppStore } from '../stores/useAppStore';
import { metersApi, readingsApi } from '../api/services';
import MeterCard from '../components/MeterCard.tsx';
import ReadingsChart from '../components/ReadingsChart.tsx';

const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL || '5000');

export default function LocalDashboard() {
  const {
    meters,
    readings,
    isLoading,
    error,
    setMeters,
    setReadings,
    setLoading,
    setError,
  } = useAppStore();

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metersData, readingsData] = await Promise.all([
        metersApi.getAll(),
        readingsApi.getRecent(24),
      ]);

      setMeters(metersData);
      setReadings(readingsData);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Calculate meter statuses
  const meterStatuses = meters.map((meter) => {
    const meterReadings = readings.filter(
      (r) => r.meter_id === meter.meter_id
    );
    const lastReading = meterReadings.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    const isConnected = lastReading
      ? new Date().getTime() - new Date(lastReading.timestamp).getTime() < 5 * 60 * 1000
      : false;

    return {
      meter,
      isConnected,
      lastReading,
      readingCount: meterReadings.length,
    };
  });

  const connectedCount = meterStatuses.filter((m) => m.isConnected).length;
  const totalCount = meterStatuses.length;

  if (isLoading && meters.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Local Dashboard</Typography>
        {lastUpdate && (
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Total Meters
              </Typography>
              <Typography variant="h5">{totalCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Connected Meters
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="h5">{connectedCount}</Typography>
                {connectedCount === totalCount && totalCount > 0 ? (
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ fontSize: 20 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Readings (24h)
              </Typography>
              <Typography variant="h5">{readings.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography color="text.secondary" gutterBottom variant="caption">
                Unsynchronized
              </Typography>
              <Typography variant="h5">
                {readings.filter((r) => !r.is_synchronized).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Meter Status Cards */}
      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        Meter Status
      </Typography>
      <Grid container spacing={2} mb={3}>
        {meterStatuses.map(({ meter, isConnected, lastReading, readingCount }) => (
          <Grid item xs={12} sm={6} md={4} key={meter.meter_id}>
            <MeterCard
              meter={meter}
              isConnected={isConnected}
              lastReading={lastReading}
              readingCount={readingCount}
            />
          </Grid>
        ))}
      </Grid>

      {meterStatuses.length === 0 && (
        <Alert severity="info">
          No meters configured. Please configure meters in the Sync MCP.
        </Alert>
      )}

      {/* Readings Chart */}
      {readings.length > 0 && (
        <Box mt={3}>
          <Typography variant="h5" gutterBottom>
            Recent Readings
          </Typography>
          <ReadingsChart readings={readings} meters={meters} />
        </Box>
      )}
    </Box>
  );
}
