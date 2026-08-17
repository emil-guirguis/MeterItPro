import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Stack,
  Typography,
  CircularProgress,
  Button,
  Tooltip,
  Alert,
  Collapse,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { BaseForm, FormContainer } from '@meterit/framework-frontend/components/form';
import { CronField } from '@meterit/framework-frontend/components/formfield/CronField';
import { MeterElementRegisterSelectorGrid } from '../../components/shared/MeterElementRegisterSelectorGrid';
import { useNotificationRulesEnhanced } from './notificationRulesStore';
import apiClient from '../../services/apiClient';
import type { NotificationRule } from '../../services/notificationRuleService';

interface NotificationRuleFormProps {
  rule?: NotificationRule;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const NotificationRuleForm: React.FC<NotificationRuleFormProps> = ({
  rule,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const rulesStore = useNotificationRulesEnhanced();

  const [debugRunning, setDebugRunning] = useState(false);
  const [debugResult, setDebugResult] = useState<{ success: boolean; message: string } | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!rule?.notification_rule_id) return;
    setHistoryLoading(true);
    apiClient
      .get(`/notification-rules/${rule.notification_rule_id}/history`)
      .then((res) => setHistory(res.data?.data?.history || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [rule?.notification_rule_id]);


  const handleDebugRun = async () => {
    if (!rule?.notification_rule_id) return;
    setDebugRunning(true);
    setDebugResult(null);
    try {
      const res = await apiClient.post(`/notification-rules/${rule.notification_rule_id}/run`);
      setDebugResult({
        success: res.data.success,
        message: res.data.success ? 'Rule executed successfully.' : `Error: ${res.data.message ?? 'Unknown error'}`,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to run rule. Please try again.';
      setDebugResult({ success: false, message: msg });
    } finally {
      setDebugRunning(false);
    }
  };

  return (
    <FormContainer>
      {rule?.notification_rule_id && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={debugRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon fontSize="small" />}
            onClick={handleDebugRun}
            disabled={debugRunning}
          >
            {debugRunning ? 'Running...' : 'Run Now'}
          </Button>
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
          schemaName="notification_rule"
          entity={rule}
          store={rulesStore}
          onCancel={onCancel}
          onLegacySubmit={onSubmit}
          loading={loading}
          showTabs={true}
          renderTabContent={(tabName) => {
            if (tabName !== 'History') return null;
            if (!rule?.notification_rule_id) {
              return (
                <Box sx={{ p: 3 }}>
                  <Typography color="textSecondary">Save the rule first to view its history.</Typography>
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
                  <Typography color="textSecondary">No history yet. This rule has not run yet.</Typography>
                </Box>
              );
            }
            return (
              <Paper variant="outlined" sx={{ mx: 2, mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent At</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((row: any) => (
                      <TableRow key={row.notification_history_id}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            color={row.status === 'sent' ? 'success' : row.status === 'failed' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{new Date(row.sent_at).toLocaleString()}</TableCell>
                        <TableCell>{row.description || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            );
          }}
          renderCustomField={(fieldName, fieldDef, value, error, isDisabled, onChange) => {
            // ── Cron field ──────────────────────────────────────────────────
            if (fieldName === 'schedule_cron') {
              return (
                <CronField
                  name="schedule_cron"
                  label={fieldDef?.label}
                  value={value ?? '0 8 * * *'}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isDisabled}
                  error={error}
                  touched={!!error}
                  help={fieldDef?.helpText}
                  required={fieldDef?.required}
                />
              );
            }

            // ── Recipients ──────────────────────────────────────────────────
            if (fieldName === 'recipients') {
              const handleAddEmail = () => {
                if (!emailInput.trim()) return;
                const current: any[] = value || [];
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.trim())) {
                  return;
                }
                if (!current.find((r) => r.email_address === emailInput.trim())) {
                  onChange([...current, { email_address: emailInput.trim(), receive_email: true }]);
                  setEmailInput('');
                }
              };

              return (
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Add Email Address"
                    placeholder="user@example.com"
                    value={emailInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    disabled={isDisabled}
                    error={!!error}
                    helperText={error || 'Enter email and press Enter, or select from contacts/users below'}
                    size="small"
                  />

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(value || []).map((recipient: any, idx: number) => (
                      <Chip
                        key={idx}
                        label={recipient.email_address}
                        onDelete={() =>
                          onChange((value || []).filter((_: any, i: number) => i !== idx))
                        }
                        disabled={isDisabled}
                      />
                    ))}
                  </Box>

                  {(!value || value.length === 0) && (
                    <Typography color="textSecondary" variant="body2">
                      No email recipients added yet
                    </Typography>
                  )}
                </Stack>
              );
            }

            // ── Meter selector ──────────────────────────────────────────────
            if (fieldName === 'meter_selections') {
              const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : (value || []);
              return (
                <MeterElementRegisterSelectorGrid
                  value={parsed}
                  onChange={(rows) => onChange(rows)}
                  disabled={isDisabled}
                  error={error}
                />
              );
            }

            return null;
          }}
        />
      </div>
    </FormContainer>
  );
};

export default NotificationRuleForm;
