import React, { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { DeviceRegisterChecklist } from '../../components/shared/DeviceRegisterChecklist';
import { useNotificationRulesEnhanced } from './notificationRulesStore';
import { favoritesService } from '../../services/favoritesService';
import { useAuth } from '../../hooks/useAuth';
import type { NotificationRule } from '../../services/notificationRuleService';

interface MeterElementOption {
  key: string; // `${meter_id}:${meter_element_id}`
  meter_id: string;
  meter_element_id: string;
  label: string; // same format as favorites: "Meter Name    A-Phase"
}

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
  const auth = useAuth();

  const [meterOptions, setMeterOptions] = useState<MeterElementOption[]>([]);
  const [metersLoading, setMetersLoading] = useState(true);
  const [debugRunning, setDebugRunning] = useState(false);
  const [debugResult, setDebugResult] = useState<{ success: boolean; message: string } | null>(null);

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

  // Load meters with elements on mount (same source as sidebar/favorites)
  useEffect(() => {
    const tenantId = parseInt(auth.user?.client || '0', 10);
    const userId = parseInt(auth.user?.users_id || '0', 10);
    if (!tenantId || !userId) return;

    setMetersLoading(true);
    favoritesService
      .getMetersWithElements(tenantId, userId)
      .then(meters => {
        const options: MeterElementOption[] = [];
        for (const meter of meters) {
          for (const el of meter.elements ?? []) {
            options.push({
              key: `${meter.id}:${el.meter_element_id}`,
              meter_id: String(meter.id),
              meter_element_id: String(el.meter_element_id),
              label: el.favorite_name || `${meter.name}    ${el.element}-${el.name}`,
            });
          }
        }
        setMeterOptions(options);
      })
      .catch(err => console.error('[NotificationRuleForm] Failed to load meters:', err))
      .finally(() => setMetersLoading(false));
  }, [auth.user?.client, auth.user?.users_id]);

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
              const [emailInput, setEmailInput] = React.useState('');

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

            // ── Meter elements ──────────────────────────────────────────────
            if (fieldName === 'meter_elements') {
              // Current value is array of { meter_id, meter_element_id }
              const selected: Array<{ meter_id: string; meter_element_id: string }> = value || [];

              const handleAdd = (key: string) => {
                const opt = meterOptions.find(o => o.key === key);
                if (!opt) return;
                if (selected.find(s => s.meter_id === opt.meter_id && s.meter_element_id === opt.meter_element_id)) return;
                onChange([...selected, { meter_id: opt.meter_id, meter_element_id: opt.meter_element_id }]);
              };

              const handleRemove = (meter_id: string, meter_element_id: string) => {
                onChange(selected.filter(s => !(s.meter_id === meter_id && s.meter_element_id === meter_element_id)));
              };

              const getLabel = (meter_id: string, meter_element_id: string) =>
                meterOptions.find(o => o.meter_id === meter_id && o.meter_element_id === meter_element_id)?.label
                ?? `${meter_id}:${meter_element_id}`;

              return (
                <Stack spacing={2}>
                  <FormControl fullWidth disabled={isDisabled || metersLoading}>
                    <InputLabel>
                      {metersLoading ? 'Loading meters…' : 'Add Meter Element'}
                    </InputLabel>
                    <Select
                      label={metersLoading ? 'Loading meters…' : 'Add Meter Element'}
                      value=""
                      startAdornment={
                        metersLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : undefined
                      }
                      onChange={(e) => {
                        if (e.target.value) handleAdd(e.target.value as string);
                      }}
                      renderValue={() => ''}
                    >
                      <MenuItem value="" disabled>Select a meter element…</MenuItem>
                      {meterOptions.map(opt => (
                        <MenuItem
                          key={opt.key}
                          value={opt.key}
                          disabled={!!selected.find(
                            s => s.meter_id === opt.meter_id && s.meter_element_id === opt.meter_element_id
                          )}
                          sx={{ fontFamily: 'monospace', fontSize: 13 }}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selected.map(s => (
                      <Chip
                        key={`${s.meter_id}:${s.meter_element_id}`}
                        label={getLabel(s.meter_id, s.meter_element_id)}
                        onDelete={() => handleRemove(s.meter_id, s.meter_element_id)}
                        sx={{ fontFamily: 'monospace', fontSize: 12 }}
                      />
                    ))}
                  </Box>

                  {selected.length === 0 && (
                    <Typography color="textSecondary" variant="body2">
                      No meter elements selected — rule will apply to all active meters
                    </Typography>
                  )}
                  {error && <Typography color="error" variant="caption">{error}</Typography>}
                </Stack>
              );
            }

            // ── Device Registers (optional filtering) ──────────────────────────
            if (fieldName === 'register_ids') {
              // Get the first meter_id from selected meter_elements
              const selectedMeterElements: Array<{ meter_id: string; meter_element_id: string }> = rule?.meter_elements || [];
              const deviceId = selectedMeterElements.length > 0 ? parseInt(selectedMeterElements[0].meter_id) : null;

              return (
                <DeviceRegisterChecklist
                  deviceId={deviceId}
                  value={Array.isArray(value) ? value : []}
                  onChange={onChange}
                  label="Registers (Optional)"
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
