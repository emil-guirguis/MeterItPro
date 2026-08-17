import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Typography
} from '@mui/material';

interface ScheduleSelectorProps {
  schedule: string;
  onChange: (schedule: string) => void;
  error?: string;
  disabled?: boolean;
}

const PREDEFINED_SCHEDULES = [
  { value: '0 9 * * *', label: 'Daily at 9:00 AM' },
  { value: '0 9 * * 1', label: 'Weekly on Monday at 9:00 AM' },
  { value: '0 9 1 * *', label: 'Monthly on the 1st at 9:00 AM' },
  { value: 'custom', label: 'Custom Cron Expression' }
];

const CRON_HELP_TEXT = `Cron format: minute hour day month day-of-week
Examples:
  0 9 * * * = Daily at 9:00 AM
  0 9 * * 1 = Every Monday at 9:00 AM
  0 9 1 * * = First day of month at 9:00 AM
  */15 * * * * = Every 15 minutes`;

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({
  schedule,
  onChange,
  error,
  disabled = false
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customCron, setCustomCron] = useState<string>(schedule);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    // Determine if current schedule matches a preset
    const matchingPreset = PREDEFINED_SCHEDULES.find(
      (p) => p.value !== 'custom' && p.value === schedule
    );

    if (matchingPreset) {
      setSelectedPreset(matchingPreset.value);
      setShowCustom(false);
    } else {
      setSelectedPreset('custom');
      setShowCustom(true);
      setCustomCron(schedule);
    }
  }, [schedule]);

  const handlePresetChange = (e: any) => {
    const value = e.target.value;
    setSelectedPreset(value);

    if (value === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(value);
    }
  };

  const handleCustomCronChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCron(value);
    onChange(value);
  };

  return (
    <Stack spacing={2}>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="schedule-label">Schedule</InputLabel>
        <Select
          labelId="schedule-label"
          inputProps={{ id: 'schedule-select' }}
          value={selectedPreset}
          onChange={handlePresetChange}
          label="Schedule"
        >
          {PREDEFINED_SCHEDULES.map((schedule) => (
            <MenuItem key={schedule.value} value={schedule.value}>
              {schedule.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showCustom && (
        <TextField
          label="Cron Expression"
          value={customCron}
          onChange={handleCustomCronChange}
          error={!!error}
          helperText={error || CRON_HELP_TEXT}
          fullWidth
          disabled={disabled}
          multiline
          rows={3}
          placeholder="0 9 * * *"
          sx={{
            '& .MuiFormHelperText-root': {
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }
          }}
        />
      )}

      {!showCustom && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          Schedule: {schedule}
        </Typography>
      )}
    </Stack>
  );
};

export default ScheduleSelector;
