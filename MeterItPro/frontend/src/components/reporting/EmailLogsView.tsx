import React, { useState } from 'react';
import type { EmailLog } from '../../services/reportingService';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
  TextField,
  Stack,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { exportEmailLogs } from '../../services/reportingService';

interface EmailLogsViewProps {
  emailLogs: EmailLog[];
  reportId: number;
}

const EmailLogsView: React.FC<EmailLogsViewProps> = ({ emailLogs, reportId }) => {
  const [searchRecipient, setSearchRecipient] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const filteredLogs = emailLogs.filter((log) =>
    log.recipient.toLowerCase().includes(searchRecipient.toLowerCase())
  );

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setExportError(null);
      const data = await exportEmailLogs('csv', reportId);
      
      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export logs');
      console.error('Error exporting logs:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setExporting(true);
      setExportError(null);
      const data = await exportEmailLogs('json', reportId);
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export logs');
      console.error('Error exporting logs:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Stack spacing={2}>
      {exportError && (
        <Alert severity="error" onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}

      {/* Search and Export Controls */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <TextField
          label="Search by Recipient"
          value={searchRecipient}
          onChange={(e) => setSearchRecipient(e.target.value)}
          placeholder="user@example.com"
          size="small"
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
          onClick={handleExportCSV}
          disabled={exporting || emailLogs.length === 0}
        >
          CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
          onClick={handleExportJSON}
          disabled={exporting || emailLogs.length === 0}
        >
          JSON
        </Button>
      </Box>

      {/* Email Logs Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Recipient</TableCell>
              <TableCell>Sent At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Error Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                  {emailLogs.length === 0 ? 'No email logs found.' : 'No matching recipients found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.report_email_logs_id} hover>
                  <TableCell>{log.recipient}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>
                    {formatDate(log.sent_at)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.status === 'delivered' ? 'Delivered' : log.status === 'sent' ? 'Sent' : 'Failed'}
                      color={log.status === 'delivered' ? 'success' : log.status === 'sent' ? 'info' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.error_details || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary */}
      <Typography variant="caption" color="text.secondary">
        Showing {filteredLogs.length} of {emailLogs.length} email logs
      </Typography>
    </Stack>
  );
};

export default EmailLogsView;
