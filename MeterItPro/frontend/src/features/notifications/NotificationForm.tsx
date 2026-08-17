import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
} from '@mui/material';
import type { NotificationType, NotificationSeverity } from '../../types/notifications';

interface NotificationFormProps {
  onSubmit: (data: {
    notification_type: NotificationType;
    title: string;
    severity: NotificationSeverity;
    description?: string;
    meter_id?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const NotificationForm: React.FC<NotificationFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    notification_type: 'stale' as NotificationType,
    title: '',
    severity: 'warning' as NotificationSeverity,
    description: '',
    meter_id: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notification');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        <TextField
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          fullWidth
          disabled={loading}
        />

        <FormControl fullWidth disabled={loading}>
          <InputLabel>Type</InputLabel>
          <Select
            value={formData.notification_type}
            label="Type"
            onChange={(e) =>
              setFormData({
                ...formData,
                notification_type: e.target.value as NotificationType,
              })
            }
          >
            <MenuItem value="stale">No Readings</MenuItem>
            <MenuItem value="all_zero">Zero Readings</MenuItem>
            <MenuItem value="error_status">Error</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={loading}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={formData.severity}
            label="Severity"
            onChange={(e) =>
              setFormData({
                ...formData,
                severity: e.target.value as NotificationSeverity,
              })
            }
          >
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          fullWidth
          multiline
          rows={4}
          disabled={loading}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Notification'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default NotificationForm;
