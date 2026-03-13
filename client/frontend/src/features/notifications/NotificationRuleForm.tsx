import React from 'react';
import { Box, Chip, FormControl, InputLabel, Select, MenuItem, Stack, Typography } from '@mui/material';
import { BaseForm, FormContainer } from '@framework/components/form';
import { CronField } from '@framework/components/formfield/CronField';
import { useNotificationRulesEnhanced } from './notificationRulesStore';
import type { NotificationRule } from '../../services/notificationRuleService';

interface NotificationRuleFormProps {
  rule?: NotificationRule;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * NotificationRuleForm Component
 *
 * Uses BaseForm with schema-driven rendering.
 * Handles custom fields for recipients and meters selection.
 */
export const NotificationRuleForm: React.FC<NotificationRuleFormProps> = ({
  rule,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const rulesStore = useNotificationRulesEnhanced();

  // Mock data - in production, fetch from API
  const availableUsers = [
    { users_id: '1', name: 'Admin User', email: 'admin@example.com' },
    { users_id: '2', name: 'Manager', email: 'manager@example.com' },
  ];

  const availableMeters = [
    { meter_id: '1', meterId: 'METER-001' },
    { meter_id: '2', meterId: 'METER-002' },
    { meter_id: '3', meterId: 'METER-003' },
  ];

  return (
    <FormContainer>
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
            // Custom rendering for schedule_cron field
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

            // Custom rendering for recipients field
            if (fieldName === 'recipients') {
              return (
                <Stack spacing={2}>
                  <FormControl fullWidth disabled={isDisabled}>
                    <InputLabel>Add Recipient</InputLabel>
                    <Select
                      label="Add Recipient"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const newRecipients = [...(value || [])];
                          if (!newRecipients.find((r) => r.users_id === e.target.value)) {
                            newRecipients.push({
                              users_id: e.target.value,
                              receive_email: true,
                            });
                            onChange(newRecipients);
                          }
                        }
                      }}
                    >
                      <MenuItem value="">Select a user...</MenuItem>
                      {availableUsers.map((user) => (
                        <MenuItem key={user.users_id} value={user.users_id}>
                          {user.name} ({user.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(value || []).map((recipient: any) => {
                      const user = availableUsers.find((u) => u.users_id === recipient.users_id);
                      return (
                        <Chip
                          key={recipient.users_id}
                          label={user?.name || recipient.users_id}
                          onDelete={() => {
                            onChange((value || []).filter((r: any) => r.users_id !== recipient.users_id));
                          }}
                        />
                      );
                    })}
                  </Box>

                  {(!value || value.length === 0) && (
                    <Typography color="textSecondary" variant="body2">
                      No recipients added yet
                    </Typography>
                  )}

                  {error && <Typography color="error" variant="caption">{error}</Typography>}
                </Stack>
              );
            }

            // Custom rendering for meter_ids field
            if (fieldName === 'meter_ids') {
              return (
                <Stack spacing={2}>
                  <FormControl fullWidth disabled={isDisabled}>
                    <InputLabel>Add Meter</InputLabel>
                    <Select
                      label="Add Meter"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const newMeters = [...(value || [])];
                          if (!newMeters.includes(e.target.value)) {
                            newMeters.push(e.target.value);
                            onChange(newMeters);
                          }
                        }
                      }}
                    >
                      <MenuItem value="">Select a meter...</MenuItem>
                      {availableMeters.map((meter) => (
                        <MenuItem key={meter.meter_id} value={meter.meter_id}>
                          {meter.meterId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(value || []).map((meterId: string) => {
                      const meter = availableMeters.find((m) => m.meter_id === meterId);
                      return (
                        <Chip
                          key={meterId}
                          label={meter?.meterId || meterId}
                          onDelete={() => {
                            onChange((value || []).filter((m: string) => m !== meterId));
                          }}
                        />
                      );
                    })}
                  </Box>

                  {(!value || value.length === 0) && (
                    <Typography color="textSecondary" variant="body2">
                      No meters selected yet
                    </Typography>
                  )}

                  {error && <Typography color="error" variant="caption">{error}</Typography>}
                </Stack>
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
