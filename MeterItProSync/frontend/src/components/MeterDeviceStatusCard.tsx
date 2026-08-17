import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import { meterDeviceApi } from '../api/services';

interface MeterConnectivity {
  meter_id: number;
  name: string;
  ip: string;
  port: number;
  device_id: number;
  online: boolean;
}

export default function MeterDeviceStatusCard() {
  const [meters, setMeters] = useState<MeterConnectivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMeter, setConfirmMeter] = useState<MeterConnectivity | null>(null);
  const [reinitializing, setReinitializing] = useState<number | null>(null);
  const [reinitResult, setReinitResult] = useState<{ meterId: number; success: boolean; error?: string } | null>(null);

  const fetchConnectivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await meterDeviceApi.getConnectivity();
      setMeters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meter status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectivity();
  }, [fetchConnectivity]);

  const handleRestart = (meter: MeterConnectivity) => {
    setReinitResult(null);
    setConfirmMeter(meter);
  };

  const handleConfirm = async () => {
    if (!confirmMeter) return;
    const meter = confirmMeter;
    setConfirmMeter(null);
    setReinitializing(meter.meter_id);
    setReinitResult(null);
    try {
      const result = await meterDeviceApi.reinitialize(meter.meter_id);
      setReinitResult({ meterId: meter.meter_id, ...result });
      // Re-check status after a short delay to allow device to restart
      setTimeout(fetchConnectivity, 3000);
    } catch (err) {
      setReinitResult({
        meterId: meter.meter_id,
        success: false,
        error: err instanceof Error ? err.message : 'Reinitialize failed',
      });
    } finally {
      setReinitializing(null);
    }
  };

  const onlineCount = meters.filter((m) => m.online).length;

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6">Meter Device Status</Typography>
              {meters.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {onlineCount} of {meters.length} online
                </Typography>
              )}
            </Box>
            <Tooltip title="Refresh status">
              <span>
                <IconButton onClick={fetchConnectivity} disabled={loading} size="small" color="primary">
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {reinitResult && (
            <Alert severity={reinitResult.success ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setReinitResult(null)}>
              {reinitResult.success
                ? 'Reinitialize command sent successfully. Status will refresh in a moment.'
                : `Reinitialize failed: ${reinitResult.error}`}
            </Alert>
          )}

          {loading && meters.length === 0 ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : meters.length === 0 ? (
            <Alert severity="info">No meters found.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Restart</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meters.map((meter, idx) => (
                    <TableRow key={`${meter.meter_id}-${idx}`}>
                      <TableCell>{meter.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{meter.ip || '—'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{meter.port}</TableCell>
                      <TableCell>
                        <Chip
                          icon={meter.online ? <CheckCircleIcon /> : <ErrorIcon />}
                          label={meter.online ? 'Online' : 'Offline'}
                          color={meter.online ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Restart device">
                          <span>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleRestart(meter)}
                              disabled={reinitializing === meter.meter_id}
                            >
                              {reinitializing === meter.meter_id ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <RestartAltIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmMeter} onClose={() => setConfirmMeter(null)}>
        <DialogTitle>Restart Meter Device</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restart <strong>{confirmMeter?.name}</strong> ({confirmMeter?.ip})?
            <br />
            This will send a BACnet ReinitializeDevice (COLDSTART) command to the device.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmMeter(null)}>Cancel</Button>
          <Button onClick={handleConfirm} color="warning" variant="contained">
            Restart
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
