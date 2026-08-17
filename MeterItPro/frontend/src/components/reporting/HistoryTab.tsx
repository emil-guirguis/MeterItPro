import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TablePagination,
  TextField,
  Stack,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getReportHistory, getEmailLogs } from '../../services/reportingService';
import type { ReportHistory, EmailLog } from '../../services/reportingService';
import EmailLogsView from './EmailLogsView';
import './HistoryTab.css';

interface HistoryTabProps {
  reportId: number;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ reportId }) => {
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalHistory, setTotalHistory] = useState(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedHistory, setSelectedHistory] = useState<ReportHistory | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [showEmailLogs, setShowEmailLogs] = useState(false);

  // Load history
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReportHistory(
        reportId,
        page + 1,
        rowsPerPage,
        startDate || undefined,
        endDate || undefined
      );
      setHistory(response.data || []);
      setTotalHistory(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [reportId, page, rowsPerPage, startDate, endDate]);

  const handleViewEmailLogs = async (historyEntry: ReportHistory) => {
    try {
      setEmailLogsLoading(true);
      setSelectedHistory(historyEntry);
      const response = await getEmailLogs(reportId, historyEntry.report_history_id);
      setEmailLogs(response.emails);
      setShowEmailLogs(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email logs');
      console.error('Error loading email logs:', err);
    } finally {
      setEmailLogsLoading(false);
    }
  };

  const handleCloseEmailLogs = () => {
    setShowEmailLogs(false);
    setSelectedHistory(null);
    setEmailLogs([]);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApplyFilters = () => {
    setPage(0);
    loadHistory();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="history-tab">
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Date Range Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2">Filter by Date Range</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="Start Date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="End Date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              Apply
            </Button>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* History Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Executed At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Error Message</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      No execution history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((entry) => (
                    <TableRow key={entry.report_history_id} hover>
                      <TableCell>{formatDate(entry.executed_at)}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status === 'success' ? 'Success' : 'Failed'}
                          color={entry.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.error_message || '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => handleViewEmailLogs(entry)}
                          endIcon={<ExpandMoreIcon />}
                        >
                          View Emails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalHistory}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      {/* Email Logs Dialog */}
      <Dialog
        open={showEmailLogs}
        onClose={handleCloseEmailLogs}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Email Logs - {selectedHistory && formatDate(selectedHistory.executed_at)}
          <IconButton
            aria-label="close"
            onClick={handleCloseEmailLogs}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {emailLogsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <EmailLogsView
              emailLogs={emailLogs}
              reportId={reportId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryTab;
