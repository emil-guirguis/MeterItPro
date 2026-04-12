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
  Alert,
  Collapse,
} from '@mui/material';
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

  const refreshHistory = () => {
    if (!report?.report_id) return;
    setHistoryLoading(true);
    apiClient
      .get(`/reports/${report.report_id}/history`)
      .then((res) => setHistory(res.data?.data?.history || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  };

  const handleDebugRun = async () => {
    if (!report?.report_id) return;
    setDebugRunning(true);
    setDebugResult(null);
    try {
      const res = await apiClient.post(`/reports/${report.report_id}/run`);
      if (!res.data.success) {
        setDebugResult({ success: false, message: `Error: ${res.data.message ?? 'Unknown error'}` });
      } else {
        setDebugResult({ success: true, message: 'Report triggered — emails will be sent shortly.' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to trigger report. Please try again.';
      setDebugResult({ success: false, message: msg });
    } finally {
      setDebugRunning(false);
      refreshHistory();
    }
  };

  useEffect(() => {
    refreshHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.report_id]);

  const runButton = report?.report_id ? (
    <Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={debugRunning ? <CircularProgress size={14} color="inherit" /> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>}
        onClick={handleDebugRun}
        disabled={debugRunning}
      >
        {debugRunning ? 'Running...' : 'Run Now'}
      </Button>
    </Box>
  ) : null;

  return (
    <FormContainer>
      {debugResult && (
        <Collapse in={!!debugResult} unmountOnExit>
          <Box sx={{ px: 2, pt: 1 }}>
            <Alert
              severity={debugResult.success ? 'success' : 'error'}
              onClose={() => setDebugResult(null)}
            >
              {debugResult.message}
            </Alert>
          </Box>
        </Collapse>
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
          tabHeaderActions={runButton}
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
                  onSaveRow={() => {
                    const formEl = document.getElementById('form-report') as HTMLFormElement | null;
                    formEl?.requestSubmit();
                  }}
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
