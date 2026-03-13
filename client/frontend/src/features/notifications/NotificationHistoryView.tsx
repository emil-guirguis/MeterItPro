import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { notificationHistoryService, type NotificationHistoryRecord } from '../../services/notificationHistoryService';
import { formatDistanceToNow } from 'date-fns';

interface NotificationHistoryViewProps {
  meterId?: string;
  timeRange?: number; // hours, default 24
}

export const NotificationHistoryView: React.FC<NotificationHistoryViewProps> = ({
  meterId,
  timeRange = 24,
}) => {
  const [history, setHistory] = useState<NotificationHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, [meterId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let records: NotificationHistoryRecord[] = [];
      if (meterId) {
        records = await notificationHistoryService.getMeterHistory24h(meterId);
      } else {
        const result = await notificationHistoryService.getHistory(50, 0);
        records = result.history;
      }

      setHistory(records);

      // Prepare chart data - group by hour
      if (meterId && records.length > 0) {
        const chartPoints = generateChartData(records);
        setChartData(chartPoints);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (records: NotificationHistoryRecord[]) => {
    const now = new Date();
    const points: any[] = [];

    // Create hourly buckets for the past 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const alertsInHour = records.filter((r) => {
        const recordTime = new Date(r.sent_at);
        return recordTime >= hourStart && recordTime < hourEnd;
      });

      points.push({
        time: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        timestamp: hourStart.getTime(),
        alertCount: alertsInHour.length,
        errors: alertsInHour.filter((r) => r.status === 'failed').length,
        sent: alertsInHour.filter((r) => r.status === 'sent').length,
      });
    }

    return points;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}

      {/* 24-Hour Chart */}
      {meterId && chartData.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Last 24 Hours - Notification Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                  formatter={(value) => [value, 'Count']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="alertCount"
                  stroke="#8884d8"
                  name="Total Alerts"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ff7300"
                  name="Failed"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Notification History
          </Typography>
          {history.length === 0 ? (
            <Typography color="textSecondary">No notification history found</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.notification_history_id}>
                      <TableCell sx={{ fontWeight: 500 }}>{record.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {formatDistanceToNow(new Date(record.sent_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {record.description || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationHistoryView;
