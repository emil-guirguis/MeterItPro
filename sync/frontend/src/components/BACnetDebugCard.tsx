import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { bacnetCollectionApi} from '../api/services';

export default function BACnetDebugCard() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleTriggerCollection = async () => {
    try {
      setIsTriggering(true);
      setMessage(null);
      await bacnetCollectionApi.triggerCollection();
      setMessage('BACnet meter reading triggered successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger meter reading';
      setMessage(`Error: ${errorMessage}`);
      console.error('Error triggering meter reading:', err);
    } finally {
      setIsTriggering(false);
    }
  };

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
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">Manual Meter Collection</Typography>
              <Typography variant="body2" color="text.secondary">
                Manually trigger BACnet meter reading collection cycle
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={isTriggering ? <CircularProgress size={20} /> : <SyncIcon />}
              onClick={handleTriggerCollection}
              disabled={isTriggering}
              size="small"
            >
              {isTriggering ? 'Collecting...' : 'Collect Now'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
