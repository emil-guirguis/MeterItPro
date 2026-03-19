import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Meter, MeterReading } from '../types';

interface MeterCardProps {
  meter: Meter;
  isConnected: boolean;
  lastReading: MeterReading | undefined;
  readingCount: number;
}

export default function MeterCard({
  meter,
  isConnected,
  lastReading,
  readingCount,
}: MeterCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1.5} gap={1}>
          <Typography variant="body1" component="div" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {meter.name}
          </Typography>
          <Chip
            icon={isConnected ? <CheckCircleIcon /> : <ErrorIcon />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {meter.ip && (
          <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', wordBreak: 'break-word' }}>
            BACnet IP: {meter.ip}
          </Typography>
        )}

        {lastReading && (
          <Box mt={1.5}>
            <Typography variant="caption" color="text.secondary" display="block">
              Last Reading:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {lastReading.value} {lastReading.unit || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {new Date(lastReading.timestamp).toLocaleString()}
            </Typography>
          </Box>
        )}

        <Box mt={1.5}>
          <Typography variant="caption" color="text.secondary">
            Readings (24h): {readingCount}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
