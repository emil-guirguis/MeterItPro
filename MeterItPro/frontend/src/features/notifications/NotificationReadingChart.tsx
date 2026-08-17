import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, Chip, Alert } from '@mui/material';
import { Modal } from '@meterit/framework-frontend/components/modal';
import type { Notification } from '../../types/notifications';

interface HourlyData {
  hour: string;
  label: string;
  count: number;
}

interface NoReadingPayload {
  summary: string;
  hourly_data: HourlyData[];
  gap_hours: string[];
  total_readings: number;
  threshold_hours: number;
}

function parseNoReadingPayload(description: string | null): NoReadingPayload | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (parsed && Array.isArray(parsed.hourly_data)) return parsed as NoReadingPayload;
  } catch {
    // not JSON – plain text description
  }
  return null;
}

interface Props {
  notification: Notification;
  onClose: () => void;
}

export const NotificationReadingChart: React.FC<Props> = ({ notification, onClose }) => {
  const payload = useMemo(
    () => parseNoReadingPayload(notification.description),
    [notification.description]
  );

  return (
    <Modal
      isOpen={true}
      title={notification.title}
      onClose={onClose}
      size="xl"
    >
      {payload ? (
        <Box>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {payload.summary} &mdash; {payload.gap_hours.length} gap hour
            {payload.gap_hours.length !== 1 ? 's' : ''} detected.
          </Alert>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={`Window: last ${payload.threshold_hours}h`} size="small" />
            <Chip label={`Total readings: ${payload.total_readings}`} size="small" />
            <Chip
              label={`Gaps: ${payload.gap_hours.length} hour${payload.gap_hours.length !== 1 ? 's' : ''}`}
              color="error"
              size="small"
            />
          </Box>

          {payload.gap_hours.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Missing at: {payload.gap_hours.join(', ')}
            </Typography>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Reads per hour
          </Typography>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={payload.hourly_data}
              margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                interval={Math.max(0, Math.floor(payload.hourly_data.length / 12) - 1)}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                width={32}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Readings']}
                labelFormatter={(label: string) => `Hour: ${label}`}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {payload.hourly_data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === 0 ? '#ef5350' : '#42a5f5'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Blue = readings received &nbsp;&bull;&nbsp; Red = no readings (gap)
          </Typography>
        </Box>
      ) : (
        <Typography variant="body1">
          {notification.description || 'No details available for this notification.'}
        </Typography>
      )}
    </Modal>
  );
};

export default NotificationReadingChart;
