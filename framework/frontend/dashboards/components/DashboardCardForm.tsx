import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  MeterElementRegisterSelectorGrid,
  type MeterRowValue,
} from '../../../../MeterItPro/frontend/src/components/shared/MeterElementRegisterSelectorGrid';
import './DashboardCardForm.css';
import {
  TIME_FRAME_OPTIONS,
  VISUALIZATION_OPTIONS,
  GROUPING_OPTIONS,
  AGGREGATION_OPTIONS,
} from '../dashboardOptions';

export interface DashboardCardModalProps {
  isOpen: boolean;
  card?: any | null;
  /** Optional — when omitted the grid fetches meters itself. */
  meters?: Array<{ id: number; name: string }>;
  /** @deprecated No longer used — grid loads elements internally */
  meterElements?: Array<{ meter_element_id: number; name: string; element?: string }>;
  /** @deprecated No longer used */
  powerColumns?: Array<{ name: string; label: string; type?: string }>;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  /** @deprecated No longer used — grid loads elements internally */
  onMeterSelect?: (meterId: number) => void;
}

interface FormData {
  card_name: string;
  card_description: string;
  meter_selections: MeterRowValue[];
  time_frame_type: string;
  visualization_type: string;
  grouping_type: string;
  aggregation_type: string;
  custom_start_date: string;
  custom_end_date: string;
}

interface FormErrors {
  [key: string]: string;
}

/** Convert an existing card's legacy fields into a MeterRowValue array. */
function cardToMeterSelections(card: any): MeterRowValue[] {
  let selections = card.meter_selections;
  if (typeof selections === 'string') {
    try { selections = JSON.parse(selections); } catch { selections = null; }
  }
  if (Array.isArray(selections)) {
    if (selections.length > 0) return selections;
    if (card.meter_selections !== undefined && card.meter_selections !== null) return [];
  }
  if (card.meter_id) {
    return [
      {
        id: `legacy_${card.meter_id}`,
        meter_id: card.meter_id,
        meter_element_ids: card.meter_element_id ? [card.meter_element_id] : null,
        register_field_names: Array.isArray(card.selected_columns) && card.selected_columns.length > 0
          ? card.selected_columns
          : ['*'],
      },
    ];
  }
  return [];
}

const emptyForm = (): FormData => ({
  card_name: '',
  card_description: '',
  meter_selections: [],
  time_frame_type: 'last_month',
  visualization_type: 'line',
  grouping_type: 'daily',
  aggregation_type: 'none',
  custom_start_date: '',
  custom_end_date: '',
});

export const DashboardCardForm: React.FC<DashboardCardModalProps> = ({
  isOpen,
  card,
  meters,
  loading = false,
  error: externalError = null,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (card) {
      setFormData({
        card_name: card.card_name || '',
        card_description: card.card_description || '',
        meter_selections: cardToMeterSelections(card),
        time_frame_type: card.time_frame_type || 'last_month',
        visualization_type: card.visualization_type || 'line',
        grouping_type: card.grouping_type || 'daily',
        aggregation_type: card.aggregation_type || 'none',
        custom_start_date: card.custom_start_date || '',
        custom_end_date: card.custom_end_date || '',
      });
    } else {
      setFormData(emptyForm());
    }
    setErrors({});
  }, [isOpen, card]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.card_name.trim()) {
      newErrors.card_name = 'Card name is required';
    }

    if (formData.meter_selections.length === 0) {
      newErrors.meter_selections = 'Add at least one meter row';
    } else {
      const invalidRows = formData.meter_selections.filter(
        row => row.register_field_names.length === 0
      );
      if (invalidRows.length > 0) {
        newErrors.meter_selections = 'Each row must have at least one register selected';
      }
    }

    if (formData.time_frame_type === 'custom') {
      if (!formData.custom_start_date) newErrors.custom_start_date = 'Start date is required';
      if (!formData.custom_end_date) newErrors.custom_end_date = 'End date is required';
      if (formData.custom_start_date && formData.custom_end_date) {
        if (new Date(formData.custom_start_date) >= new Date(formData.custom_end_date)) {
          newErrors.custom_end_date = 'End date must be after start date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const submitData: any = {
        card_name: formData.card_name,
        card_description: formData.card_description,
        time_frame_type: formData.time_frame_type,
        visualization_type: formData.visualization_type,
        grouping_type: formData.grouping_type,
        aggregation_type: formData.aggregation_type,
        meter_selections: formData.meter_selections,
      };

      if (formData.time_frame_type === 'custom') {
        submitData.custom_start_date = formData.custom_start_date;
        submitData.custom_end_date   = formData.custom_end_date;
      }

      await onSubmit(submitData);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || loading;
  const title = card ? 'Edit Dashboard Card' : 'Create Dashboard Card';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <Button onClick={onClose} disabled={isDisabled} sx={{ minWidth: 'auto', p: 1 }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {externalError && <Alert severity="error">{externalError}</Alert>}

          <TextField
            fullWidth
            label="Card Name"
            name="card_name"
            value={formData.card_name}
            onChange={handleFieldChange}
            placeholder="e.g., Monthly Energy Consumption"
            error={!!errors.card_name}
            helperText={errors.card_name}
            disabled={isDisabled}
            required
          />

          <TextField
            fullWidth
            label="Description"
            name="card_description"
            value={formData.card_description}
            onChange={handleFieldChange}
            placeholder="Optional description for this card"
            multiline
            rows={2}
            disabled={isDisabled}
          />

          {/* Report Settings */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 180 }} disabled={isDisabled}>
              <InputLabel>Time Frame</InputLabel>
              <Select label="Time Frame" name="time_frame_type" value={formData.time_frame_type} onChange={handleFieldChange}>
                {TIME_FRAME_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }} disabled={isDisabled}>
              <InputLabel>Visualization</InputLabel>
              <Select label="Visualization" name="visualization_type" value={formData.visualization_type} onChange={handleFieldChange}>
                {VISUALIZATION_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }} disabled={isDisabled}>
              <InputLabel>Grouping</InputLabel>
              <Select label="Grouping" name="grouping_type" value={formData.grouping_type} onChange={handleFieldChange}>
                {GROUPING_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }} disabled={isDisabled}>
              <InputLabel>Aggregation</InputLabel>
              <Select label="Aggregation" name="aggregation_type" value={formData.aggregation_type} onChange={handleFieldChange}>
                {AGGREGATION_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Custom Date Range */}
          {formData.time_frame_type === 'custom' && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Start Date" name="custom_start_date" type="date"
                  value={formData.custom_start_date} onChange={handleFieldChange}
                  error={!!errors.custom_start_date} helperText={errors.custom_start_date}
                  disabled={isDisabled} required InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="End Date" name="custom_end_date" type="date"
                  value={formData.custom_end_date} onChange={handleFieldChange}
                  error={!!errors.custom_end_date} helperText={errors.custom_end_date}
                  disabled={isDisabled} required InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}

          {/* Meter / Element / Register Grid */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Meters &amp; Registers *
            </Typography>
            <MeterElementRegisterSelectorGrid
              meters={meters}
              value={formData.meter_selections}
              onChange={rows => {
                setFormData(prev => ({ ...prev, meter_selections: rows }));
                if (errors.meter_selections) {
                  setErrors(prev => { const n = { ...prev }; delete n.meter_selections; return n; });
                }
              }}
              disabled={isDisabled}
              error={errors.meter_selections}
            />
          </Box>

        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isDisabled} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          variant="contained"
          startIcon={submitting ? <CircularProgress size={20} /> : undefined}
        >
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
