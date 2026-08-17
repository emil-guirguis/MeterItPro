import React, { useState, useEffect, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { BaseForm, FormContainer } from '@meterit/framework-frontend/components/form';
import { CronField } from '@meterit/framework-frontend/components/formfield/CronField';
import { useReportsEnhanced } from './reportsStore';
import { RecipientsField } from './components';
import { MeterElementRegisterSelectorGrid } from '../../components/shared/MeterElementRegisterSelectorGrid';
import type { MeterRowValue } from '../../components/shared/MeterElementRegisterSelectorGrid';
import apiClient from '../../services/apiClient';
import type { Report } from './types';
import './ReportForm.css';

// ── ReportForm ────────────────────────────────────────────────────────────────

interface ReportFormProps {
  report?: Report;
  onSubmit: (data: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  hideMeters?: boolean;
}

const REPORT_TYPE_OPTIONS = [
  { value: 'cost', label: 'Cost' },
  { value: 'revenue', label: 'Revenue' },
];

const VISUALIZATION_OPTIONS = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'csv', label: 'CSV' },
];

const ATTACH_AS_OPTIONS = [
  { value: 'html', label: 'Embedded HTML' },
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
];

export const ReportForm: React.FC<ReportFormProps> = ({
  report,
  onSubmit,
  onCancel,
  loading = false,
  hideMeters = false,
}) => {
  const reports = useReportsEnhanced();

  const schemaBustedRef = useRef(false);
  if (!schemaBustedRef.current) {
    schemaBustedRef.current = true;
    try { localStorage.removeItem('schema_cache_report'); } catch { /* ignore */ }
  }

  const [selectedType, setSelectedType] = useState<string>(report?.type || 'cost');
  const [selectedVisualization, setSelectedVisualization] = useState<string>(report?.visualization_type || 'bar');
  const attachAsOnChangeRef = useRef<((val: any) => void) | null>(null);
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

  const handlePreview = async () => {
    if (!report?.report_id) return;
    try {
      const res = await apiClient.get(`/reports/${report.report_id}/preview`, { responseType: 'text' });
      const blob = new Blob([res.data as string], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) win.addEventListener('load', () => URL.revokeObjectURL(url));
    } catch {
      setDebugResult({ success: false, message: 'Failed to open preview.' });
    }
  };

  const runButton = report?.report_id ? (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<span className="material-symbols-outlined report-form__run-icon">preview</span>}
        onClick={handlePreview}
        disabled={debugRunning}
      >
        Preview
      </Button>
      <Button
        variant="outlined"
        size="small"
        color="primary"
        startIcon={debugRunning ? <CircularProgress size={14} color="inherit" /> : <span className="material-symbols-outlined report-form__run-icon">send</span>}
        onClick={handleDebugRun}
        disabled={debugRunning}
      >
        {debugRunning ? 'Sending...' : 'Send Email'}
      </Button>
    </Box>
  ) : null;

  const handleLegacySubmit = async (savedData: any) => {
    await onSubmit(savedData);
  };

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
          onLegacySubmit={handleLegacySubmit}
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
            if (fieldName === 'type') {
              return (
                <FormControl size="small" fullWidth disabled={isDisabled} error={!!error}>
                  <InputLabel required={fieldDef?.required}>Report Type</InputLabel>
                  <Select
                    label="Report Type"
                    value={value ?? 'cost'}
                    onChange={(e) => {
                      const newType = e.target.value as string;
                      setSelectedType(newType);
                      onChange(newType);
                    }}
                  >
                    {REPORT_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }

            if (fieldName === 'visualization_type') {
              return (
                <FormControl size="small" fullWidth disabled={isDisabled} error={!!error}>
                  <InputLabel>Visualization</InputLabel>
                  <Select
                    label="Visualization"
                    value={value ?? 'bar'}
                    onChange={(e) => {
                      const newViz = e.target.value as string;
                      setSelectedVisualization(newViz);
                      onChange(newViz);
                      if (newViz === 'csv') {
                        attachAsOnChangeRef.current?.('csv');
                      }
                    }}
                  >
                    {VISUALIZATION_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }

            if (fieldName === 'attach_as') {
              attachAsOnChangeRef.current = onChange;
              const isCsvViz = selectedVisualization === 'csv';
              return (
                <FormControl size="small" fullWidth disabled={isDisabled || isCsvViz} error={!!error}>
                  <InputLabel>Attach As</InputLabel>
                  <Select
                    label="Attach As"
                    value={isCsvViz ? 'csv' : (value ?? 'html')}
                    onChange={(e) => onChange(e.target.value)}
                  >
                    {ATTACH_AS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }

            if (fieldName === 'cron') {
              return (
                <CronField
                  name="cron"
                  label={fieldDef?.label ?? 'Schedule'}
                  value={value ?? '0 9 * * *'}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isDisabled}
                  error={error}
                  touched={!!error}
                  help={fieldDef?.helpText ?? 'When this report should be sent'}
                  required={fieldDef?.required}
                />
              );
            }

            if (fieldName === 'recipients') {
              return (
                <RecipientsField
                  value={value || { from: null, to: [] }}
                  error={error}
                  disabled={isDisabled}
                  onChange={onChange}
                />
              );
            }

            if (fieldName === 'meter_selections' && hideMeters) {
              return <></>;
            }

            if (fieldName === 'meter_selections') {
              const parsed: MeterRowValue[] = typeof value === 'string' ? JSON.parse(value || '[]') : (value || []);
              return (
                <>
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
                </>
              );
            }

            return null;
          }}
        />
      </div>
    </FormContainer>
  );
};

export default ReportForm;
