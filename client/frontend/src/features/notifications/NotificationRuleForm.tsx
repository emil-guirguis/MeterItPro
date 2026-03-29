import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { BaseForm, FormContainer } from '@framework/components/form';
import { CronField } from '@framework/components/formfield/CronField';
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

  const [meters, setMeters] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    apiClient.get('/meters', { params: { limit: 1000 } })
      .then(res => {
        const list = res.data?.data || res.data || [];
        setMeters(Array.isArray(list) ? list : []);
      })
      .catch(() => setMeters([]));
  }, []);

  const handleDebugRun = async () => {
    if (!rule?.notification_rule_id) return;
    setDebugRunning(true);
    setDebugResult(null);
    const url = `http://localhost:3005/debug/run-notification-rule/${rule.notification_rule_id}`;
    try {
      const res = await fetch(url, { method: 'POST' });
      const json = await res.json();
      setDebugResult({
        success: json.success,
        message: json.success ? 'Rule executed successfully' : `Error: ${json.error ?? 'Unknown error'}`,
      });
    } catch {
      setDebugResult({ success: false, message: 'Could not reach MCP debug server on port 3005' });
    } finally {
      setDebugRunning(false);
    }
  };

  return (
    <FormContainer>
      {import.meta.env.DEV && rule?.notification_rule_id && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Tooltip title="Run this rule now via the MCP agent (port 3005 must be running)">
            <span>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={debugRunning ? <CircularProgress size={14} color="inherit" /> : <BugReportIcon />}
                onClick={handleDebugRun}
                disabled={debugRunning}
              >
                [DEV] Run This Rule Now
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
          schemaName="notification_rule"
          entity={rule}
          store={rulesStore}
          onCancel={onCancel}
          onLegacySubmit={onSubmit}
          loading={loading}
          showTabs={true}
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
                        label={recipient.email_address || recipient.users_id}
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
                  meters={meters}
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
