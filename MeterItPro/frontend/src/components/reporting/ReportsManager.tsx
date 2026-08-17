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
  Toolbar,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getReports, deleteReport, toggleReportStatus } from '../../services/reportingService';
import type { Report } from '../../services/reportingService';
import ReportForm from './ReportForm';
import './ReportsManager.css';

interface ReportsManagerProps {
  onReportCreated?: () => void;
  onReportUpdated?: () => void;
}

const ReportsManager: React.FC<ReportsManagerProps> = ({ onReportCreated, onReportUpdated }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  // Load reports
  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReports(page + 1, rowsPerPage);
      setReports(response.data || []);
      setTotalReports(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [page, rowsPerPage]);

  const handleCreateReport = () => {
    setEditingReport(null);
    setShowForm(true);
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingReport(null);
  };

  const handleFormSubmit = async () => {
    handleFormClose();
    await loadReports();
    if (editingReport) {
      onReportUpdated?.();
    } else {
      onReportCreated?.();
    }
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    try {
      await deleteReport(reportToDelete.report_id);
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
      console.error('Error deleting report:', err);
    }
  };

  const handleToggleStatus = async (report: Report) => {
    try {
      await toggleReportStatus(report.report_id);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle report status');
      console.error('Error toggling report status:', err);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="reports-manager">
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Toolbar sx={{ pl: 0, pr: 0, mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Reports
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateReport}
        >
          Create Report
        </Button>
      </Toolbar>

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
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No reports found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.report_id} hover>
                      <TableCell>{report.name}</TableCell>
                      <TableCell>{report.type}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {report.schedule}
                      </TableCell>
                      <TableCell>{report.recipients.length} recipient(s)</TableCell>
                      <TableCell>
                        <Chip
                          label={report.enabled ? 'Enabled' : 'Disabled'}
                          color={report.enabled ? 'success' : 'default'}
                          size="small"
                          onClick={() => handleToggleStatus(report)}
                          clickable
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditReport(report)}
                          title="Edit report"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(report)}
                          title="Delete report"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalReports}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      {/* Report Form Dialog */}
      <Dialog
        open={showForm}
        onClose={handleFormClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editingReport ? 'Edit Report' : 'Create New Report'}
          <IconButton
            aria-label="close"
            onClick={handleFormClose}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 2 }}>
            <ReportForm
              report={editingReport || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormClose}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the report "{reportToDelete?.name}"? This action cannot be undone.
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </div>
  );
};

export default ReportsManager;
