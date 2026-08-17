import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Divider,
  TextField,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import './CronField.css';

type FrequencyType = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'one_time';

interface CronState {
  frequency: FrequencyType;
  weekDay: number;    // 0=Sunday … 6=Saturday
  monthDay: number;   // 1–31
  months: number[];   // 1-12, empty = all months (*)
  hour: number;       // 0–23
  minute: number;     // 0, 15, 30, 45
  oneTimeDate: string; // YYYY-MM-DDTHH:mm
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

const MONTHS_OF_YEAR = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
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
    day === 1 || day === 21 || day === 31 ? 'st'
    : day === 2 || day === 22 ? 'nd'
    : day === 3 || day === 23 ? 'rd'
    : 'th';
  return { value: day, label: `${day}${suffix}` };
});

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily',    label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekly',   label: 'Weekly' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'one_time', label: 'One Time' },
];

function defaultOneTimeDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function parseCron(cron: string): CronState {
  const defaults: CronState = {
    frequency: 'daily', weekDay: 1, monthDay: 1, months: [],
    hour: 8, minute: 0, oneTimeDate: defaultOneTimeDate(),
  };
  if (!cron) return defaults;

  if (cron.startsWith('@once:')) {
    // format: @once:YYYY-MM-DDTHH:mm
    const rest = cron.slice(6);
    const [datePart, timePart] = rest.split('T');
    const [h, m] = (timePart || '09:00').split(':').map(Number);
    return {
      ...defaults,
      frequency: 'one_time',
      oneTimeDate: datePart || defaultOneTimeDate(),
      hour: h >= 0 && h <= 23 ? h : 9,
      minute: [0, 15, 30, 45].includes(m) ? m : 0,
    };
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaults;

  const [min, hourPart, dom, mon, dow] = parts;
  const parsedMinute = parseInt(min, 10);
  const parsedHour = parseInt(hourPart, 10);
  if (isNaN(parsedMinute) || isNaN(parsedHour)) return defaults;

  const minute = [0, 15, 30, 45].includes(parsedMinute) ? parsedMinute : 0;
  const hour = parsedHour >= 0 && parsedHour <= 23 ? parsedHour : 8;

  const months: number[] =
    mon !== '*'
      ? mon.split(',').map(Number).filter((n) => n >= 1 && n <= 12)
      : [];

  if (dom !== '*') {
    const parsedDom = parseInt(dom, 10);
    return {
      frequency: 'monthly',
      weekDay: 1,
      monthDay: parsedDom >= 1 && parsedDom <= 31 ? parsedDom : 1,
      months,
      hour,
      minute,
      oneTimeDate: defaultOneTimeDate(),
    };
  }
  if (dow === '1-5') return { ...defaults, frequency: 'weekdays', hour, minute };
  if (dow !== '*') {
    const parsedDow = parseInt(dow, 10);
    return {
      ...defaults,
      frequency: 'weekly',
      weekDay: parsedDow >= 0 && parsedDow <= 6 ? parsedDow : 1,
      hour,
      minute,
    };
  }
  return { ...defaults, frequency: 'daily', hour, minute };
}

function composeCron(state: CronState): string {
  const { frequency, weekDay, monthDay, months, hour, minute, oneTimeDate } = state;
  const monthStr = months.length > 0 ? months.sort((a, b) => a - b).join(',') : '*';
  switch (frequency) {
    case 'one_time':  return `@once:${oneTimeDate}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    case 'daily':     return `${minute} ${hour} * * *`;
    case 'weekdays':  return `${minute} ${hour} * * 1-5`;
    case 'weekly':    return `${minute} ${hour} * * ${weekDay}`;
    case 'monthly':   return `${minute} ${hour} ${monthDay} ${monthStr} *`;
  }
}

function formatTime(hour: number, minute: number): string {
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
    onChange?.({ target: { name, value: composeCron(updated) } } as React.ChangeEvent<HTMLInputElement>);
  };

  const summaryText = (() => {
    if (state.frequency === 'one_time') {
      if (!state.oneTimeDate) return 'One-time — no date selected';
      try {
        const d = new Date(state.oneTimeDate);
        return `Once on ${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
      } catch {
        return `Once on ${state.oneTimeDate}`;
      }
    }
    const time = formatTime(state.hour, state.minute);
    const monthLabel =
      state.months.length === 0
        ? 'every month'
        : state.months.length <= 3
          ? state.months.map((m) => MONTHS_OF_YEAR[m - 1].label).join(', ')
          : `${state.months.length} months`;
    switch (state.frequency) {
      case 'daily':    return `Every day at ${time}`;
      case 'weekdays': return `Every weekday (Mon–Fri) at ${time}`;
      case 'weekly':   return `Every ${DAYS_OF_WEEK[state.weekDay].label} at ${time}`;
      case 'monthly':  return `On the ${MONTH_DAYS[state.monthDay - 1].label} of ${monthLabel} at ${time}`;
    }
  })();

  return (
    <Box className="cron-field">
      {label && (
        <FormLabel required={required} className="cron-field__label">
          {label}
        </FormLabel>
      )}

      <Paper variant="outlined" className="cron-field__panel">
        {/* Left: frequency radio list */}
        <Box className="cron-field__freq-col">
          <RadioGroup
            value={state.frequency}
            onChange={(e) => handleChange({ frequency: e.target.value as FrequencyType })}
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio size="small" disabled={disabled} onBlur={onBlur} />}
                label={<Typography variant="body2">{opt.label}</Typography>}
                className="cron-field__freq-option"
              />
            ))}
          </RadioGroup>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Right: contextual controls */}
        <Box className="cron-field__detail-col">
          {state.frequency === 'one_time' ? (
            <>
              <Box className="cron-field__day-row">
                <Typography variant="body2" className="cron-field__detail-label">Date</Typography>
                <TextField
                  size="small"
                  type="date"
                  value={state.oneTimeDate}
                  onChange={(e) => handleChange({ oneTimeDate: e.target.value })}
                  disabled={disabled}
                  onBlur={onBlur}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
              </Box>
              <Box className="cron-field__time-row">
                <Typography variant="body2" className="cron-field__detail-label">Time</Typography>
                <FormControl size="small" className="cron-field__time-hour" disabled={disabled}>
                  <InputLabel>Hour</InputLabel>
                  <Select
                    value={state.hour}
                    label="Hour"
                    onChange={(e) => handleChange({ hour: Number(e.target.value) })}
                  >
                    {HOURS.map((h) => (
                      <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" className="cron-field__time-minute" disabled={disabled}>
                  <InputLabel>Min</InputLabel>
                  <Select
                    value={state.minute}
                    label="Min"
                    onChange={(e) => handleChange({ minute: Number(e.target.value) })}
                  >
                    {MINUTES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </>
          ) : (
            <>
              {/* Time row */}
              <Box className="cron-field__time-row">
                <Typography variant="body2" className="cron-field__detail-label">Time</Typography>
                <FormControl size="small" className="cron-field__time-hour" disabled={disabled}>
                  <InputLabel>Hour</InputLabel>
                  <Select
                    value={state.hour}
                    label="Hour"
                    onChange={(e) => handleChange({ hour: Number(e.target.value) })}
                  >
                    {HOURS.map((h) => (
                      <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" className="cron-field__time-minute" disabled={disabled}>
                  <InputLabel>Min</InputLabel>
                  <Select
                    value={state.minute}
                    label="Min"
                    onChange={(e) => handleChange({ minute: Number(e.target.value) })}
                  >
                    {MINUTES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Day of week */}
              {state.frequency === 'weekly' && (
                <Box className="cron-field__day-row">
                  <Typography variant="body2" className="cron-field__detail-label">Day</Typography>
                  <FormControl size="small" fullWidth disabled={disabled}>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={state.weekDay}
                      label="Day of Week"
                      onChange={(e) => handleChange({ weekDay: Number(e.target.value) })}
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Day of month + months */}
              {state.frequency === 'monthly' && (
                <>
                  <Box className="cron-field__day-row">
                    <Typography variant="body2" className="cron-field__detail-label">Day</Typography>
                    <FormControl size="small" fullWidth disabled={disabled}>
                      <InputLabel>Day of Month</InputLabel>
                      <Select
                        value={state.monthDay}
                        label="Day of Month"
                        onChange={(e) => handleChange({ monthDay: Number(e.target.value) })}
                      >
                        {MONTH_DAYS.map((d) => (
                          <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box className="cron-field__day-row">
                    <Typography variant="body2" className="cron-field__detail-label">Months</Typography>
                    <FormControl size="small" fullWidth disabled={disabled}>
                      <InputLabel>Months (all if empty)</InputLabel>
                      <Select
                        multiple
                        value={state.months}
                        label="Months (all if empty)"
                        input={<OutlinedInput label="Months (all if empty)" />}
                        onChange={(e) => {
                          const val = e.target.value as number[];
                          handleChange({ months: val });
                        }}
                        renderValue={(selected) =>
                          (selected as number[]).length === 0
                            ? 'Every month'
                            : (selected as number[])
                                .sort((a, b) => a - b)
                                .map((m) => MONTHS_OF_YEAR[m - 1].label.slice(0, 3))
                                .join(', ')
                        }
                      >
                        {MONTHS_OF_YEAR.map((m) => (
                          <MenuItem key={m.value} value={m.value}>
                            <Checkbox checked={state.months.includes(m.value)} size="small" />
                            <ListItemText primary={m.label} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Summary */}
      <Box className="cron-field__summary">
        <Typography variant="body2" className="cron-field__summary-text">
          {summaryText}
        </Typography>
      </Box>

      {showError && <FormHelperText error>{error}</FormHelperText>}
      {!showError && help && <FormHelperText>{help}</FormHelperText>}
    </Box>
  );
};
