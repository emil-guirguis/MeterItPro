import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  FormHelperText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './DashboardCardModal.css';

export interface DashboardCardModalProps {
  isOpen: boolean;
  card?: any | null;
  meters: Array<{ id: number; name: string }>;
  meterElements: Array<{ meter_element_id: number; name: string; element?: string }>;
  powerColumns: Array<{ name: string; label: string; type?: string }>;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onMeterSelect?: (meterId: number) => void;
}

interface FormData {
  card_name: string;
  card_description: string;
  meter_id: string;
  meter_element_id: string;
  selected_columns: string[];
  time_frame_type: 'custom' | 'last_month' | 'this_month_to_date' | 'since_installation';
  custom_start_date: string;
  custom_end_date: string;
  visualization_type: 'pie' | 'line' | 'candlestick' | 'bar' | 'area';
}

interface FormErrors {
  [key: string]: string;
}

export const DashboardCardModal: React.FC<DashboardCardModalProps> = ({
  isOpen,
  card,
  meters,
  meterElements,
  powerColumns,
  loading = false,
  error: externalError = null,
  onClose,
  onSubmit,
  onMeterSelect
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState<FormData>({
    card_name: '',
    card_description: '',
    meter_id: '',
    meter_element_id: '',
    selected_columns: [],
    time_frame_type: 'last_month',
    custom_start_date: '',
    custom_end_date: '',
    visualization_type: 'line'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);

  // Initialize form ONLY when modal first opens
  useEffect(() => {
    if (!isOpen) return;

    if (card) {
      setFormData({
        card_name: card.card_name || '',
        card_description: card.card_description || '',
        meter_id: card.meter_id?.toString() || '',
        meter_element_id: card.meter_element_id?.toString() || '',
        selected_columns: Array.isArray(card.selected_columns) ? card.selected_columns : [],
        time_frame_type: card.time_frame_type || 'last_month',
        custom_start_date: card.custom_start_date || '',
        custom_end_date: card.custom_end_date || '',
        visualization_type: card.visualization_type || 'line'
      });
      setSelectedMeterId(card.meter_id || null);
    } else {
      setFormData({
        card_name: '',
        card_description: '',
        meter_id: '',
        meter_element_id: '',
        selected_columns: [],
        time_frame_type: 'last_month',
        custom_start_date: '',
        custom_end_date: '',
        visualization_type: 'line'
      });
      setSelectedMeterId(null);
    }
    setErrors({});
  }, [isOpen, card]);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.card_name.trim()) {
      newErrors.card_name = 'Card name is required';
    }

    if (!selectedMeterId) {
      newErrors.meter_id = 'Meter is required';
    }

    if (!formData.meter_element_id) {
      newErrors.meter_element_id = 'Meter element is required';
    } else if (selectedMeterId) {
      // Validate that selected element exists in the provided list
      const selectedElement = meterElements.find(
        el => el.meter_element_id.toString() === formData.meter_element_id
      );
      if (!selectedElement) {
        newErrors.meter_element_id = 'Selected meter element is not available';
      }
    }

    if (formData.selected_columns.length === 0) {
      newErrors.selected_columns = 'At least one power column must be selected';
    }

    if (formData.time_frame_type === 'custom') {
      if (!formData.custom_start_date) {
        newErrors.custom_start_date = 'Start date is required for custom range';
      }
      if (!formData.custom_end_date) {
        newErrors.custom_end_date = 'End date is required for custom range';
      }
      if (formData.custom_start_date && formData.custom_end_date) {
        const startDate = new Date(formData.custom_start_date);
        const endDate = new Date(formData.custom_end_date);
        if (startDate >= endDate) {
          newErrors.custom_end_date = 'End date must be after start date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleFieldChange = (e: any) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (name === 'selected_columns') {
        setFormData(prev => ({
          ...prev,
          selected_columns: checkbox.checked
            ? [...prev.selected_columns, value]
            : prev.selected_columns.filter(col => col !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const submitData: any = {
        card_name: formData.card_name,
        card_description: formData.card_description,
        meter_id: selectedMeterId || 0,
        meter_element_id: formData.meter_element_id ? parseInt(formData.meter_element_id) : 0,
        selected_columns: formData.selected_columns,
        time_frame_type: formData.time_frame_type,
        visualization_type: formData.visualization_type
      };

      // Add custom date range if applicable
      if (formData.time_frame_type === 'custom') {
        submitData.custom_start_date = formData.custom_start_date;
        submitData.custom_end_date = formData.custom_end_date;
      }

      console.log('📋 [DashboardCardModal] Submitting form data:', submitData);
      onSubmit(submitData);
    } finally {
      setSubmitting(false);
    }
  };

  const title = card ? 'Edit Dashboard Card' : 'Create Dashboard Card';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <Button
          onClick={onClose}
          disabled={submitting || loading}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {externalError && (
            <Alert severity="error" onClose={() => {}}>
              {externalError}
            </Alert>
          )}

          {/* Card Name */}
          <TextField
            fullWidth
            label="Card Name"
            name="card_name"
            value={formData.card_name}
            onChange={handleFieldChange}
            placeholder="e.g., Monthly Energy Consumption"
            error={!!errors.card_name}
            helperText={errors.card_name}
            disabled={submitting || loading}
            required
            variant="outlined"
          />

          {/* Card Description */}
          <TextField
            fullWidth
            label="Description"
            name="card_description"
            value={formData.card_description}
            onChange={handleFieldChange}
            placeholder="Optional description for this card"
            multiline
            rows={3}
            disabled={submitting || loading}
            variant="outlined"
          />

          {/* Meter Selector */}
          <FormControl fullWidth error={!!errors.meter_id} disabled={submitting || loading || !meters || meters.length === 0}>
            <InputLabel>Meter *</InputLabel>
            <Select
              label="Meter *"
              value={selectedMeterId || ''}
              onChange={(e) => {
                const meterId = e.target.value ? parseInt(e.target.value as string) : null;
                setSelectedMeterId(meterId);
                setFormData(prev => ({
                  ...prev,
                  meter_element_id: ''
                }));
                if (meterId && onMeterSelect) {
                  onMeterSelect(meterId);
                }
                if (errors.meter_id) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.meter_id;
                    return newErrors;
                  });
                }
              }}
            >
              <MenuItem value="">
                <em>-- Select a meter --</em>
              </MenuItem>
              {meters && meters.map(meter => (
                <MenuItem key={meter.id} value={meter.id}>
                  {meter.name}
                </MenuItem>
              ))}
            </Select>
            {errors.meter_id && <FormHelperText error>{errors.meter_id}</FormHelperText>}
          </FormControl>

          {/* Meter Element Selector */}
          <FormControl fullWidth error={!!errors.meter_element_id} disabled={submitting || loading || !selectedMeterId}>
            <InputLabel>Meter Element *</InputLabel>
            <Select
              label="Meter Element *"
              name="meter_element_id"
              value={formData.meter_element_id || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  meter_element_id: value
                }));
                if (errors.meter_element_id) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.meter_element_id;
                    return newErrors;
                  });
                }
              }}
            >
              <MenuItem value="">
                <em>-- Select a meter element --</em>
              </MenuItem>
              {meterElements && meterElements.length > 0 && meterElements.map(element => (
                <MenuItem key={element.meter_element_id} value={element.meter_element_id.toString()}>
                  {element.element ? `${element.element} - ${element.name}` : element.name}
                </MenuItem>
              ))}
            </Select>
            {errors.meter_element_id && <FormHelperText error>{errors.meter_element_id}</FormHelperText>}
          </FormControl>

          {/* Power Columns Multi-Select */}
          <FormControl fullWidth error={!!errors.selected_columns} disabled={submitting || loading}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Power Columns *
            </Typography>
            {!powerColumns || powerColumns.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No power columns available
              </Typography>
            ) : (
              <FormGroup sx={{ p: 1.5, backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#fafafa', borderRadius: 1 }}>
                {powerColumns && powerColumns.map(column => (
                  <FormControlLabel
                    key={column.name}
                    control={
                      <Checkbox
                        name="selected_columns"
                        value={column.name}
                        checked={formData.selected_columns.includes(column.name)}
                        onChange={handleFieldChange}
                        disabled={submitting || loading}
                      />
                    }
                    label={column.label || column.name}
                  />
                ))}
              </FormGroup>
            )}
            {errors.selected_columns && <FormHelperText error>{errors.selected_columns}</FormHelperText>}
          </FormControl>

          {/* Time Frame Type Selector */}
          <FormControl fullWidth disabled={submitting || loading}>
            <InputLabel>Time Frame Type *</InputLabel>
            <Select
              label="Time Frame Type *"
              name="time_frame_type"
              value={formData.time_frame_type}
              onChange={handleFieldChange}
            >
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="this_month_to_date">This Month to Date</MenuItem>
              <MenuItem value="since_installation">Since Installation</MenuItem>
              <MenuItem value="custom">Custom Date Range</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Range (Conditional) */}
          {formData.time_frame_type === 'custom' && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="custom_start_date"
                  type="date"
                  value={formData.custom_start_date}
                  onChange={handleFieldChange}
                  error={!!errors.custom_start_date}
                  helperText={errors.custom_start_date}
                  disabled={submitting || loading}
                  required
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="custom_end_date"
                  type="date"
                  value={formData.custom_end_date}
                  onChange={handleFieldChange}
                  error={!!errors.custom_end_date}
                  helperText={errors.custom_end_date}
                  disabled={submitting || loading}
                  required
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          )}

          {/* Visualization Type Selector */}
          <FormControl fullWidth disabled={submitting || loading}>
            <InputLabel>Visualization Type *</InputLabel>
            <Select
              label="Visualization Type *"
              name="visualization_type"
              value={formData.visualization_type}
              onChange={handleFieldChange}
            >
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
              <MenuItem value="area">Area Chart</MenuItem>
              <MenuItem value="candlestick">Candlestick Chart</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={submitting || loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading}
          variant="contained"
          startIcon={submitting ? <CircularProgress size={20} /> : undefined}
        >
          {submitting ? 'Saving...' : card ? 'Update Card' : 'Create Card'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
