import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel,
  MenuItem, Paper, Select, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import PowerIcon from '@mui/icons-material/Power';
import DevicesIcon from '@mui/icons-material/Devices';
import { supportDeviceAPI } from '../supportDevicesStore';
import type { SupportDevice } from '../supportDevicesStore';

const DEVICE_TYPES = ['Electric', 'Gas', 'Water', 'Steam', 'Other'];
const MANUFACTURERS = ['DENT Instruments', 'Honeywell', 'Siemens', 'TBWC Inc.'];

interface DeviceForm {
  manufacturer: string;
  model_number: string;
  description: string;
  type: string;
  number_of_elements: number | '';
  default_price: number | '';
  active: boolean;
}

const emptyForm = (): DeviceForm => ({
  manufacturer: '', model_number: '', description: '',
  type: 'Electric', number_of_elements: '', default_price: '', active: true,
});

const SupportDevicesPage: React.FC = () => {
  const [devices, setDevices]       = useState<SupportDevice[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SupportDevice | null>(null);
  const [form, setForm]             = useState<DeviceForm>(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportDeviceAPI.getAll({});
      setDevices(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (d: SupportDevice) => {
    setEditTarget(d);
    setForm({
      manufacturer: d.manufacturer,
      model_number: d.model_number,
      description: d.description,
      type: d.type,
      number_of_elements: d.number_of_elements,
      default_price: d.default_price,
      active: d.active,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.manufacturer || !form.model_number || !form.type) {
      setFormError('Manufacturer, model number, and type are required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        number_of_elements: Number(form.number_of_elements) || 0,
        default_price: Number(form.default_price) || 0,
      };
      if (editTarget) {
        await supportDeviceAPI.update(editTarget.id, payload);
      } else {
        await supportDeviceAPI.create(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save device');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (d: SupportDevice) => {
    try {
      if (d.active) {
        await supportDeviceAPI.deactivate(d.id);
      } else {
        await supportDeviceAPI.activate(d.id);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle device status');
    }
  };

  const setF = (key: keyof DeviceForm, val: any) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <DevicesIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">Device Catalog</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Device
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Manufacturer</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Elements</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No devices in catalog</Typography>
                  </TableCell>
                </TableRow>
              ) : devices.map(d => (
                <TableRow key={d.device_id} sx={{ opacity: d.active ? 1 : 0.5 }}>
                  <TableCell>{d.manufacturer}</TableCell>
                  <TableCell>{d.model_number}</TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell>{d.number_of_elements || '—'}</TableCell>
                  <TableCell>{d.default_price ? `$${d.default_price}` : '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.active ? 'Active' : 'Inactive'}
                      color={d.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <Button size="small" onClick={() => openEdit(d)} startIcon={<EditIcon />}>
                        Edit
                      </Button>
                    </Tooltip>
                    <Tooltip title={d.active ? 'Deactivate' : 'Activate'}>
                      <Button
                        size="small"
                        color={d.active ? 'warning' : 'success'}
                        onClick={() => handleToggleActive(d)}
                        startIcon={d.active ? <PowerOffIcon /> : <PowerIcon />}
                      >
                        {d.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editTarget ? 'Edit Device' : 'Add Device'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Manufacturer</InputLabel>
            <Select value={form.manufacturer} label="Manufacturer" onChange={e => setF('manufacturer', e.target.value)}>
              {MANUFACTURERS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            label="Model Number"
            value={form.model_number}
            onChange={e => setF('model_number', e.target.value)}
            fullWidth required margin="normal"
          />

          <TextField
            label="Description"
            value={form.description}
            onChange={e => setF('description', e.target.value)}
            fullWidth margin="normal"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Type</InputLabel>
            <Select value={form.type} label="Type" onChange={e => setF('type', e.target.value)}>
              {DEVICE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            label="Number of Elements"
            type="number"
            value={form.number_of_elements}
            onChange={e => setF('number_of_elements', e.target.value)}
            fullWidth margin="normal"
          />

          <TextField
            label="Default Price ($)"
            type="number"
            value={form.default_price}
            onChange={e => setF('default_price', e.target.value)}
            fullWidth margin="normal"
          />

          {editTarget && (
            <FormControlLabel
              control={<Switch checked={form.active} onChange={e => setF('active', e.target.checked)} />}
              label="Active"
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportDevicesPage;
