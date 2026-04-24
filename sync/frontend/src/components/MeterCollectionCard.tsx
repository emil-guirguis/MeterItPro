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
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import SyncIcon from '@mui/icons-material/Sync';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { bacnetCollectionApi } from '../api/services';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { ConnectionState } from '../types/connection';

interface CollectionStatus {
  agent_status: {
    isRunning: boolean;
    totalCyclesExecuted: number;
    totalReadingsCollected: number;
    totalErrorsEncountered: number;
  };
  last_cycle_result: {
    cycleId: string;
    startTime: string;
    endTime: string;
    metersProcessed: number;
    readingsCollected: number;
    errorCount: number;
    success: boolean;
  } | null;
  active_errors: Array<{
    meterId: string;
    dataPoint?: string;
    operation: string;
    error: string;
    timestamp: string;
  }>;
}

export default function MeterCollectionCard() {
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expandErrors, setExpandErrors] = useState(false);
  const { status: connectionStatus } = useConnectionStatus();
  const mcpOnline = connectionStatus.mcpServer === ConnectionState.CONNECTED;

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const data = await bacnetCollectionApi.getStatus();
      setStatus(data);
      setMessage(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collection status';
      console.error('Error fetching collection status:', err);
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerCollection = async () => {
    try {
      setIsTriggering(true);
      setMessage(null);
      await bacnetCollectionApi.triggerCollection();
      setMessage('Collection cycle triggered successfully');
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger collection';
      setMessage(`Error: ${errorMessage}`);
      console.error('Error triggering collection:', err);
    } finally {
      setIsTriggering(false);
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
          <Alert severity="error">Failed to load meter collection agent status</Alert>
        </CardContent>
      </Card>
    );
  }

  const lastCycle = status.last_cycle_result;
  const agentStatus = status.agent_status;

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
              {agentStatus.isRunning ? (
                <CheckCircleIcon color="success" fontSize="large" />
              ) : (
                <InfoIcon color="info" fontSize="large" />
              )}
              <Box>
                <Typography variant="h6">Meter Collection Agent</Typography>
                <Chip
                  icon={agentStatus.isRunning ? <CheckCircleIcon /> : <InfoIcon />}
                  label={agentStatus.isRunning ? 'Running' : 'MCP Managed'}
                  color={agentStatus.isRunning ? 'success' : 'info'}
                  size="small"
                />
              </Box>
            </Box>
            <Tooltip title={!mcpOnline ? 'MCP server is offline — cannot trigger collection' : ''}>
              <span>
                <Button
                  variant="contained"
                  startIcon={isTriggering ? <CircularProgress size={20} /> : <SyncIcon />}
                  onClick={handleTriggerCollection}
                  disabled={isTriggering || !mcpOnline}
                  size="small"
                >
                  {isTriggering ? 'Collecting...' : 'Collect Now'}
                </Button>
              </span>
            </Tooltip>
          </Box>

          {!mcpOnline && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              MCP server is offline. Manual collection is unavailable. Data shown is from the local database.
            </Alert>
          )}

          {mcpOnline && !agentStatus.isRunning && (
            <Alert severity="info" sx={{ mb: 2 }}>
              BACnet collection agent is managed by the MCP process. Data shown is from the local database.
            </Alert>
          )}

          {lastCycle && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom>
                Last Collection Cycle
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{new Date(lastCycle.startTime).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    icon={lastCycle.success ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={lastCycle.success ? 'Success' : 'Failed'}
                    color={lastCycle.success ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Meters Processed</Typography>
                  <Typography variant="body1">{lastCycle.metersProcessed}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Readings Collected</Typography>
                  <Typography variant="body1" color="success.main">{lastCycle.readingsCollected}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Errors</Typography>
                  <Typography variant="body1" color={lastCycle.errorCount > 0 ? 'error.main' : 'success.main'}>
                    {lastCycle.errorCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">
                    {Math.round(
                      (new Date(lastCycle.endTime).getTime() - new Date(lastCycle.startTime).getTime()) / 1000
                    )}s
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom>Agent Metrics</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Cycles</Typography>
                <Typography variant="h6">{agentStatus.totalCyclesExecuted}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Readings</Typography>
                <Typography variant="h6" color="success.main">{agentStatus.totalReadingsCollected}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Errors</Typography>
                <Typography variant="h6" color={agentStatus.totalErrorsEncountered > 0 ? 'error.main' : 'success.main'}>
                  {agentStatus.totalErrorsEncountered}
                </Typography>
              </Box>
            </Box>
          </Box>

          {status.active_errors.length > 0 && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2">
                  Active Errors ({status.active_errors.length})
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setExpandErrors(!expandErrors)}
                  sx={{ transform: expandErrors ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
              <Collapse in={expandErrors}>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Meter ID</TableCell>
                        <TableCell>Data Point</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Error</TableCell>
                        <TableCell>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {status.active_errors.map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{error.meterId}</TableCell>
                          <TableCell>{error.dataPoint || '-'}</TableCell>
                          <TableCell><Chip label={error.operation} size="small" variant="outlined" /></TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error">{error.error}</Typography>
                          </TableCell>
                          <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}
