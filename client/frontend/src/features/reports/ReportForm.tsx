import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tooltip,
  Alert,
  Collapse,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { BaseForm, FormContainer } from '@framework/components/form';
import { CronField } from '@framework/components/formfield/CronField';
import { useReportsEnhanced } from './reportsStore';
import { RecipientsField } from './components';
import { MeterElementRegisterSelectorGrid } from '../../components/shared/MeterElementRegisterSelectorGrid';
import type { MeterRowValue } from '../../components/shared/MeterElementRegisterSelectorGrid';
import apiClient from '../../services/apiClient';
import type { Report } from './types';
import './ReportForm.css';

interface ReportFormProps {
  report?: Report;
  onSubmit: (data: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * ReportForm Component
 * 
 * Refactored to use BaseForm with schema-driven rendering.
 * Removes manual state management and validation logic.
 * Uses custom field renderers for recipients, schedule, meter/element, and register fields.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5**
 */
export const ReportForm: React.FC<ReportFormProps> = ({
  report,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const reports = useReportsEnhanced();

  const [debugRunning, setDebugRunning] = useState(false);
  const [debugResult, setDebugResult] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleDebugRun = async () => {
    if (!report?.report_id) return;
    setDebugRunning(true);
    setDebugResult(null);
    const url = `http://localhost:3005/debug/run-report/${report.report_id}`;
    try {
      const res = await fetch(url, { method: 'POST' });
      const json = await res.json();
      setDebugResult({
        success: json.success,
        message: json.success ? 'Report executed successfully' : `Error: ${json.error ?? 'Unknown error'}`,
      });
    } catch {
      setDebugResult({ success: false, message: 'Could not reach MCP debug server on port 3005' });
    } finally {
      setDebugRunning(false);
    }
  };

  useEffect(() => {
    if (!report?.report_id) return;
    setHistoryLoading(true);
    apiClient
      .get(`/reports/${report.report_id}/history`)
      .then((res) => setHistory(res.data?.data?.history || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [report?.report_id]);

  return (
    <FormContainer>
      {import.meta.env.DEV && report?.report_id && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Tooltip title="Run this report now via the MCP agent (port 3005 must be running)">
            <span>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={debugRunning ? <CircularProgress size={14} color="inherit" /> : <BugReportIcon />}
                onClick={handleDebugRun}
                disabled={debugRunning}
              >
                [DEV] Run This Report Now
              </Button>
            </span>
          </Tooltip>
          <Collapse in={!!debugResult} unmountOnExit>
            {debugResult && (
              <Alert
                severity={debugResult.success ? 'success' : 'error'}
                onClose={() => setDebugResult(null)}
                sx={{ mt: 1 }}
              >
                {debugResult.message}
              </Alert>
            )}
          </Collapse>
        </Box>
      )}
      <div className="form-container__content">
        <BaseForm
          schemaName="report"
          entity={report ? { ...report, id: report.report_id } : undefined}
          store={reports}
          onCancel={onCancel}
          onLegacySubmit={onSubmit}
          loading={loading}
          showTabs={true}
          renderTabContent={(tabName) => {
            if (tabName !== 'History') return null;
            if (!report?.report_id) {
              return (
                <Box sx={{ p: 3 }}>
                  <Typography color="textSecondary">Save the report first to view its history.</Typography>
                </Box>
              );
            }
            if (historyLoading) {
              return (
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography>Loading history...</Typography>
                </Box>
              );
            }
            if (history.length === 0) {
              return (
                <Box sx={{ p: 3 }}>
                  <Typography color="textSecondary">No history yet. This report has not run yet.</Typography>
                </Box>
              );
            }
            return (
              <Paper variant="outlined" sx={{ mx: 2, mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Executed At</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((row: any) => (
                      <TableRow key={row.report_history_id}>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            color={row.status === 'success' ? 'success' : row.status === 'failed' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{new Date(row.executed_at).toLocaleString()}</TableCell>
                        <TableCell>{row.error_message || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            );
          }}
          renderCustomField={(fieldName, fieldDef, value, error, isDisabled, onChange) => {
            // Custom rendering for schedule field
            if (fieldName === 'schedule') {
              return (
                <CronField
                  name="schedule"
                  label={fieldDef?.label}
                  value={value ?? '0 9 * * *'}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isDisabled}
                  error={error}
                  touched={!!error}
                  help={fieldDef?.helpText}
                  required={fieldDef?.required}
                />
              );
            }

            // Custom rendering for recipients field
            if (fieldName === 'recipients') {
              return (
                <RecipientsField
                  value={value || []}
                  error={error}
                  isDisabled={isDisabled}
                  onChange={onChange}
                />
              );
            }

            // Custom rendering for meter_selections field
            if (fieldName === 'meter_selections') {
              const parsed: MeterRowValue[] = typeof value === 'string' ? JSON.parse(value || '[]') : (value || []);
              return (
                <MeterElementRegisterSelectorGrid
                  value={parsed}
                  onChange={onChange}
                  disabled={isDisabled}
                  error={error}
                />
              );
            }

            // Return null to let BaseForm render default field
            return null;
          }}
        />
      </div>
    </FormContainer>
  );
};

export default ReportForm;
