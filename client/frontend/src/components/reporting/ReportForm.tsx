import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  FormHelperText,
  Tabs,
  Tab
} from '@mui/material';
import { createReport, updateReport } from '../../services/reportingService';
import type { Report } from '../../services/reportingService';
import { validateCronExpression } from '../../utils/validationHelpers';
import { MeterElementRegisterSelectorGrid } from '../shared/MeterElementRegisterSelectorGrid';
import type { MeterRowValue } from '../shared/MeterElementRegisterSelectorGrid';
import RecipientManager from './RecipientManager';
import ScheduleSelector from './ScheduleSelector';

interface ReportFormProps {
  report?: Report;
  onSubmit: () => void;
  onCancel: () => void;
}

const REPORT_TYPES = [
  { value: 'meter_readings', label: 'Meter Readings' },
  { value: 'usage_summary', label: 'Usage Summary' },
  { value: 'daily_report', label: 'Daily Report' }
];

const ReportForm: React.FC<ReportFormProps> = ({ report, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'meter_readings',
    schedule: '0 9 * * *',
    recipients: [] as string[],
    config: {} as Record<string, any>,
    enabled: true
  });

  const [meterSelections, setMeterSelections] = useState<MeterRowValue[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        type: report.type,
        schedule: report.schedule,
        recipients: report.recipients,
        config: report.config,
        enabled: report.enabled
      });

      if (report.config?.meter_selections) {
        setMeterSelections(report.config.meter_selections);
      }
    }
  }, [report]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Report name must not exceed 255 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Report type is required';
    }

    if (!formData.schedule.trim()) {
      newErrors.schedule = 'Schedule is required';
    } else if (!validateCronExpression(formData.schedule)) {
      newErrors.schedule = 'Invalid cron expression format';
    }

    if (formData.recipients.length === 0) {
      newErrors.recipients = 'At least one recipient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);

      const reportConfig = {
        ...formData.config,
        meter_selections: meterSelections,
      };

      if (report) {
        await updateReport(report.report_id, {
          name: formData.name,
          type: formData.type,
          schedule: formData.schedule,
          recipients: formData.recipients,
          config: reportConfig,
          enabled: formData.enabled
        });
      } else {
        await createReport({
          name: formData.name,
          type: formData.type,
          schedule: formData.schedule,
          recipients: formData.recipients,
          config: reportConfig,
          enabled: true
        });
      }

      onSubmit();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save report';
      setSubmitError(errorMessage);
      console.error('Error saving report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    if (errors.name) setErrors({ ...errors, name: '' });
  };

  const handleTypeChange = (e: any) => {
    setFormData({ ...formData, type: e.target.value });
    if (errors.type) setErrors({ ...errors, type: '' });
  };

  const handleScheduleChange = (schedule: string) => {
    setFormData({ ...formData, schedule });
    if (errors.schedule) setErrors({ ...errors, schedule: '' });
  };

  const handleRecipientsChange = (recipients: string[]) => {
    setFormData({ ...formData, recipients });
    if (errors.recipients) setErrors({ ...errors, recipients: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
          <Tab label="General" />
          <Tab label="Recipients" />
        </Tabs>
      </Box>

      <Stack spacing={3}>
        {activeTab === 0 && (
          <>
            <TextField
              label="Report Name"
              value={formData.name}
              onChange={handleNameChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              disabled={loading}
              placeholder="e.g., Monthly Usage Report"
            />

            <FormControl fullWidth error={!!errors.type} disabled={loading}>
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select labelId="report-type-label" inputProps={{ id: 'report-type-select' }} value={formData.type} onChange={handleTypeChange} label="Report Type">
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <ScheduleSelector
              schedule={formData.schedule}
              onChange={handleScheduleChange}
              error={errors.schedule}
              disabled={loading}
            />

            <MeterElementRegisterSelectorGrid
              value={meterSelections}
              onChange={setMeterSelections}
              disabled={loading}
            />
          </>
        )}

        {activeTab === 1 && (
          <RecipientManager
            recipients={formData.recipients}
            onChange={handleRecipientsChange}
            error={errors.recipients}
            disabled={loading}
          />
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 2 }}>
          <Button onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Saving...' : report ? 'Update Report' : 'Create Report'}
          </Button>
        </Box>
      </Stack>
    </form>
  );
};

export default ReportForm;
