import { Box, Typography, Tooltip } from '@mui/material';
import { ConnectionState } from '../types/connection';

interface ConnectionStatusIndicatorProps {
  label: string;
  state: ConnectionState;
  tooltip?: string;
}

export default function ConnectionStatusIndicator({
  label,
  state,
  tooltip
}: ConnectionStatusIndicatorProps) {
  const getStatusColor = (): string => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return '#4caf50';
      case ConnectionState.DISCONNECTED:
      case ConnectionState.ERROR:
        return '#f44336';
      case ConnectionState.CHECKING:
      default:
        return '#cccccc';
    }
  };

  const getStatusText = (): string => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return `${label}\nConnected`;
      case ConnectionState.DISCONNECTED:
        return `${label}\nDisconnected`;
      case ConnectionState.ERROR:
        return `${label}\nError`;
      case ConnectionState.CHECKING:
      default:
        return 'Checking...';
    }
  };

  const getTooltipText = (): string => {
    if (tooltip) return tooltip;
    
    switch (state) {
      case ConnectionState.CONNECTED:
        return `${label} is connected and operational`;
      case ConnectionState.DISCONNECTED:
        return `${label} is disconnected`;
      case ConnectionState.ERROR:
        return `${label} connection error`;
      case ConnectionState.CHECKING:
      default:
        return 'Checking connection status...';
    }
  };

  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box
        sx={{
          width: 120,
          height: 60,
          borderRadius: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: getStatusColor(),
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            transform: 'translateY(-2px)',
          }
        }}
      >
        <Typography
          sx={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            textAlign: 'center',
            whiteSpace: 'pre-line',
          }}
        >
          {getStatusText()}
        </Typography>
      </Box>
    </Tooltip>
  );
}
