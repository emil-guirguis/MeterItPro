import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  FormLabel,
} from '@mui/material';
import './CronField.css';

type FrequencyType = 'daily' | 'weekdays' | 'weekly' | 'monthly';

interface CronState {
  frequency: FrequencyType;
  weekDay: number;   // 0=Sunday … 6=Saturday
  monthDay: number;  // 1–31
  hour: number;      // 0–23
  minute: number;    // 0, 15, 30, 45
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return { value: 0, label: '12:00 AM' };
  if (i < 12) return { value: i, label: `${i}:00 AM` };
  if (i === 12) return { value: 12, label: '12:00 PM' };
  return { value: i, label: `${i - 12}:00 PM` };
});

const MINUTES = [
  { value: 0, label: ':00' },
  { value: 15, label: ':15' },
  { value: 30, label: ':30' },
  { value: 45, label: ':45' },
];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const suffix =
    day === 1 || day === 21 || day === 31
      ? 'st'
      : day === 2 || day === 22
      ? 'nd'
      : day === 3 || day === 23
      ? 'rd'
      : 'th';
  return { value: day, label: `${day}${suffix}` };
});

function parseCron(cron: string): CronState {
  const defaults: CronState = { frequency: 'daily', weekDay: 1, monthDay: 1, hour: 8, minute: 0 };
  if (!cron) return defaults;

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaults;

  const [min, hourPart, dom, , dow] = parts;
  const parsedMinute = parseInt(min, 10);
  const parsedHour = parseInt(hourPart, 10);
  if (isNaN(parsedMinute) || isNaN(parsedHour)) return defaults;

  const minute = [0, 15, 30, 45].includes(parsedMinute) ? parsedMinute : 0;
  const hour = parsedHour >= 0 && parsedHour <= 23 ? parsedHour : 8;

  if (dom !== '*') {
    const parsedDom = parseInt(dom, 10);
    return {
      frequency: 'monthly',
      weekDay: 1,
      monthDay: parsedDom >= 1 && parsedDom <= 31 ? parsedDom : 1,
      hour,
      minute,
    };
  }

  if (dow === '1-5') return { frequency: 'weekdays', weekDay: 1, monthDay: 1, hour, minute };

  if (dow !== '*') {
    const parsedDow = parseInt(dow, 10);
    return {
      frequency: 'weekly',
      weekDay: parsedDow >= 0 && parsedDow <= 6 ? parsedDow : 1,
      monthDay: 1,
      hour,
      minute,
    };
  }

  return { frequency: 'daily', weekDay: 1, monthDay: 1, hour, minute };
}

function composeCron(state: CronState): string {
  const { frequency, weekDay, monthDay, hour, minute } = state;
  switch (frequency) {
    case 'daily':    return `${minute} ${hour} * * *`;
    case 'weekdays': return `${minute} ${hour} * * 1-5`;
    case 'weekly':   return `${minute} ${hour} * * ${weekDay}`;
    case 'monthly':  return `${minute} ${hour} ${monthDay} * *`;
  }
}

function formatHourMinute(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${period}`;
}

export interface CronFieldProps {
  name: string;
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent) => void;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
  help?: string;
  required?: boolean;
}

export const CronField: React.FC<CronFieldProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  touched,
  help,
  required,
}) => {
  const [state, setState] = useState<CronState>(() => parseCron(value ?? ''));

  useEffect(() => {
    setState(parseCron(value ?? ''));
  }, [value]);

  const showError = touched && error;

  const handleChange = (patch: Partial<CronState>) => {
    const updated = { ...state, ...patch };
    setState(updated);
    const cronValue = composeCron(updated);
    onChange?.({
      target: { name, value: cronValue },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const cronPreview = composeCron(state);

  const frequencyLabel =
    state.frequency === 'daily'
      ? 'Every day'
      : state.frequency === 'weekdays'
      ? 'Every weekday (Mon–Fri)'
      : state.frequency === 'weekly'
      ? `Every ${DAYS_OF_WEEK[state.weekDay].label}`
      : `Monthly on the ${MONTH_DAYS[state.monthDay - 1].label}`;

  const summaryText = `${frequencyLabel} at ${formatHourMinute(state.hour, state.minute)}`;

  return (
    <Box className="cron-field">
      {label && (
        <FormLabel required={required} className="cron-field__label">
          {label}
        </FormLabel>
      )}

      {/* Row 1: Frequency */}
      <FormControl fullWidth variant="outlined" disabled={disabled} error={!!showError}>
        <InputLabel>Frequency</InputLabel>
        <Select
          value={state.frequency}
          onChange={(e) => handleChange({ frequency: e.target.value as FrequencyType })}
          onBlur={onBlur}
          label="Frequency"
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekdays">Weekdays (Mon–Fri)</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>
      </FormControl>

      {/* Row 2 (conditional): Day picker */}
      {state.frequency === 'weekly' && (
        <FormControl fullWidth variant="outlined" disabled={disabled}>
          <InputLabel>Day of Week</InputLabel>
          <Select
            value={state.weekDay}
            onChange={(e) => handleChange({ weekDay: Number(e.target.value) })}
            label="Day of Week"
          >
            {DAYS_OF_WEEK.map((d) => (
              <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {state.frequency === 'monthly' && (
        <FormControl fullWidth variant="outlined" disabled={disabled}>
          <InputLabel>Day of Month</InputLabel>
          <Select
            value={state.monthDay}
            onChange={(e) => handleChange({ monthDay: Number(e.target.value) })}
            label="Day of Month"
          >
            {MONTH_DAYS.map((d) => (
              <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Row 3: Time */}
      <Box className="cron-field__time-row">
        <FormControl variant="outlined" disabled={disabled} className="cron-field__time-hour">
          <InputLabel>Hour</InputLabel>
          <Select
            value={state.hour}
            onChange={(e) => handleChange({ hour: Number(e.target.value) })}
            label="Hour"
          >
            {HOURS.map((h) => (
              <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" disabled={disabled} className="cron-field__time-minute">
          <InputLabel>Min</InputLabel>
          <Select
            value={state.minute}
            onChange={(e) => handleChange({ minute: Number(e.target.value) })}
            label="Min"
          >
            {MINUTES.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary + cron preview */}
      <Box className="cron-field__summary">
        <Typography variant="body2" className="cron-field__summary-text">
          {summaryText}
        </Typography>
        <Typography variant="caption" className="cron-field__preview">
          <code>{cronPreview}</code>
        </Typography>
      </Box>

      {showError && <FormHelperText error>{error}</FormHelperText>}
      {!showError && help && <FormHelperText>{help}</FormHelperText>}
    </Box>
  );
};
