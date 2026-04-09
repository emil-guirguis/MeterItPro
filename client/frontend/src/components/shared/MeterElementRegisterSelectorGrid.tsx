import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  ListItemText,
  Chip,
  CircularProgress,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  OutlinedInput,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import apiClient from '../../services/apiClient';
import { useMetersList } from '../../hooks/useMetersList';
import './MeterElementRegisterSelectorGrid.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MeterRowValue {
  /** Client-side key for React. Include in saved JSONB — backend can ignore it. */
  id: string;
  /** null = All Meters */
  meter_id: number | null;
  /** null = All Elements; empty array = none yet chosen */
  meter_element_ids: number[] | null;
  /** ['*'] = All Registers; at least one entry required */
  register_field_names: string[];
}

interface Meter {
  id?: number;
  meter_id?: number;
  name: string;
  serial_number?: string;
}

interface MeterElement {
  meter_element_id: number;
  name: string;
  element?: string;
}

interface Register {
  field_name: string;
  name: string;
  unit?: string;
}

export interface MeterElementRegisterSelectorGridProps {
  /** Optional — when omitted the component fetches meters itself via useMetersList. */
  meters?: Meter[];
  value: MeterRowValue[];
  onChange: (rows: MeterRowValue[]) => void;
  disabled?: boolean;
  /** Error message shown below the grid */
  error?: string;
  /** Called when the user clicks Save on a specific row */
  onSaveRow?: (row: MeterRowValue) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL = '__all__';

function genId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRow(): MeterRowValue {
  return { id: genId(), meter_id: null, meter_element_ids: null, register_field_names: [] };
}

function getMeterId(m: Meter): number {
  return m.meter_id ?? m.id ?? 0;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MeterElementRegisterSelectorGrid: React.FC<MeterElementRegisterSelectorGridProps> = ({
  meters: metersProp,
  value,
  onChange,
  disabled = false,
  error,
  onSaveRow,
}) => {
  const { meters: fetchedMeters, loading: metersLoading } = useMetersList();
  const meters = metersProp ?? fetchedMeters;

  const [elementsCache, setElementsCache] = useState<Record<number, MeterElement[]>>({});
  const [registersCache, setRegistersCache] = useState<Record<number, Register[]>>({});
  const [loadingEl, setLoadingEl] = useState<Record<number, boolean>>({});
  const [loadingReg, setLoadingReg] = useState<Record<number, boolean>>({});
  const [touchedRegRows, setTouchedRegRows] = useState<Set<string>>(new Set());
  const requested = useRef<Set<number>>(new Set());

  const rows = value;

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadMeterData = useCallback(async (meterId: number) => {
    if (requested.current.has(meterId)) return;
    requested.current.add(meterId);

    // Elements
    setLoadingEl(prev => ({ ...prev, [meterId]: true }));
    try {
      const res = await apiClient.get(`/meters/${meterId}/elements`);
      const d = res.data;
      const list: MeterElement[] = Array.isArray(d) ? d
        : (d.success && Array.isArray(d.data)) ? d.data : [];
      setElementsCache(prev => ({ ...prev, [meterId]: list }));
    } catch {
      setElementsCache(prev => ({ ...prev, [meterId]: [] }));
    } finally {
      setLoadingEl(prev => ({ ...prev, [meterId]: false }));
    }

    // Registers
    setLoadingReg(prev => ({ ...prev, [meterId]: true }));
    try {
      const res = await apiClient.get(`/meters/${meterId}/registers`);
      const d = res.data;
      const raw: any[] = Array.isArray(d) ? d
        : (d.success && Array.isArray(d.data)) ? d.data : [];
      // Each item may be { register: {...} } or a Register directly
      const list: Register[] = raw.map(r => r.register ?? r).filter(r => r.field_name);
      setRegistersCache(prev => ({ ...prev, [meterId]: list }));
    } catch {
      setRegistersCache(prev => ({ ...prev, [meterId]: [] }));
    } finally {
      setLoadingReg(prev => ({ ...prev, [meterId]: false }));
    }
  }, []);

  // Preload data for any meters already in the value + all meters (for All Meters rows)
  useEffect(() => {
    rows.forEach(row => {
      if (row.meter_id !== null) loadMeterData(row.meter_id);
    });
    meters.forEach(m => loadMeterData(getMeterId(m)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // ── Row mutations ───────────────────────────────────────────────────────────

  const updateRow = (id: string, patch: Partial<MeterRowValue>) =>
    onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r));

  const addRow = () => onChange([...rows, emptyRow()]);

  const deleteRow = (id: string) => onChange(rows.filter(r => r.id !== id));

  // ── Change handlers ─────────────────────────────────────────────────────────

  const handleMeterChange = (rowId: string, val: string) => {
    if (val === ALL) {
      // All Meters → force All Elements + All Registers
      updateRow(rowId, { meter_id: null, meter_element_ids: null, register_field_names: [] });
    } else {
      const meterId = parseInt(val);
      updateRow(rowId, { meter_id: meterId, meter_element_ids: null, register_field_names: [] });
      loadMeterData(meterId);
    }
  };

  const handleElementsChange = (rowId: string, rawVal: string[]) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const wasAll = row.meter_element_ids === null;
    const clickedAll = rawVal.includes(ALL);

    if (clickedAll && !wasAll) {
      // Selected "All Elements"
      updateRow(rowId, { meter_element_ids: null });
    } else if (!clickedAll && wasAll) {
      // Deselected "All Elements" — clear selection
      updateRow(rowId, { meter_element_ids: [] });
    } else if (clickedAll && wasAll) {
      // "All" was active and user clicked a specific item — switch to that item only
      const specific = rawVal.filter(v => v !== ALL).map(Number);
      updateRow(rowId, { meter_element_ids: specific });
    } else {
      updateRow(rowId, { meter_element_ids: rawVal.map(Number) });
    }
  };

  const handleRegistersChange = (rowId: string, rawVal: string[]) => {
    setTouchedRegRows(prev => new Set(prev).add(rowId));
    updateRow(rowId, { register_field_names: rawVal });
  };

  // ── Duplicate detection ─────────────────────────────────────────────────────

  const duplicateRowIds = React.useMemo((): Set<string> => {
    const dupes = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i];
        const b = rows[j];

        // Skip rows with no registers selected yet (still being configured)
        if (a.register_field_names.length === 0 || b.register_field_names.length === 0) continue;

        // Check meter overlap
        const meterOverlap = a.meter_id === null || b.meter_id === null || a.meter_id === b.meter_id;
        if (!meterOverlap) continue;

        // Check element overlap
        const elA = a.meter_element_ids;
        const elB = b.meter_element_ids;
        let elementOverlap = false;
        if (elA === null || elB === null) {
          elementOverlap = true; // at least one is "All Elements"
        } else {
          elementOverlap = elA.some(id => elB.includes(id));
        }
        if (!elementOverlap) continue;

        // Check register overlap
        const regA = a.register_field_names;
        const regB = b.register_field_names;
        let registerOverlap = false;
        if (regA.includes('*') || regB.includes('*')) {
          registerOverlap = true;
        } else {
          registerOverlap = regA.some(fn => regB.includes(fn));
        }
        if (!registerOverlap) continue;

        dupes.add(a.id);
        dupes.add(b.id);
      }
    }
    return dupes;
  }, [rows]);

  // ── Union registers (for All Meters rows) ───────────────────────────────────

  const allRegistersUnion = React.useMemo((): Register[] => {
    const seen = new Set<string>();
    const result: Register[] = [];
    Object.values(registersCache).forEach(regs => {
      regs.forEach(r => {
        if (!seen.has(r.field_name)) {
          seen.add(r.field_name);
          result.push(r);
        }
      });
    });
    return result;
  }, [registersCache]);

  // ── Select value helpers ────────────────────────────────────────────────────

  const elementSelectValue = (row: MeterRowValue): string[] =>
    row.meter_element_ids === null ? [ALL] : row.meter_element_ids.map(String);

  const registerSelectValue = (row: MeterRowValue): string[] =>
    row.register_field_names.filter(fn => fn !== '*');

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderElementChips = (row: MeterRowValue) => {
    if (row.meter_element_ids === null)
      return <Chip label="All Elements" size="small" className="merseg-chip merseg-chip--all" />;
    if (row.meter_element_ids.length === 0)
      return <span className="merseg-placeholder">Select elements…</span>;
    const els = row.meter_id !== null ? (elementsCache[row.meter_id] ?? []) : [];
    return (
      <Box className="merseg-chips">
        {row.meter_element_ids.map(id => {
          const el = els.find(e => e.meter_element_id === id);
          const label = el ? (el.element ? `${el.element} – ${el.name}` : el.name) : String(id);
          return <Chip key={id} label={label} size="small" className="merseg-chip" />;
        })}
      </Box>
    );
  };

  const renderRegisterChips = (row: MeterRowValue) => {
    if (row.register_field_names.length === 0)
      return <span className="merseg-placeholder">Select registers…</span>;
    const regs = row.meter_id !== null ? (registersCache[row.meter_id] ?? []) : allRegistersUnion;
    return (
      <Box className="merseg-chips">
        {row.register_field_names.map(fn => {
          const reg = regs.find(r => r.field_name === fn);
          const label = reg ? reg.name : fn;
          return <Chip key={fn} label={label} size="small" className="merseg-chip" />;
        })}
      </Box>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box className="merseg-root">
      <Paper variant="outlined" className="merseg-paper">
        <Table size="small" className="merseg-table">
          <TableHead>
            <TableRow className="merseg-header-row">
              <TableCell className="merseg-col-meter">Meter</TableCell>
              <TableCell className="merseg-col-elements">Elements</TableCell>
              <TableCell className="merseg-col-registers">Registers</TableCell>
              <TableCell className="merseg-col-actions" sx={{ textAlign: 'left', pl: 0, ml: 0 }} padding="none">
                <Button
                  type="button"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addRow}
                  disabled={disabled}
                  variant="text"
                  sx={{ whiteSpace: 'nowrap', minWidth: 0, px: 0, ml: -0.5 }}
                >
                  Add
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="merseg-empty-cell">
                  No meters added. Click "Add Meter" to begin.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const mid = row.meter_id;
                const elements = mid !== null ? (elementsCache[mid] ?? []) : [];
                const isAllMeters = mid === null;
                const elLoading = mid !== null && !!loadingEl[mid];
                const regLoading = mid !== null && !!loadingReg[mid];
                const registers = mid !== null ? (registersCache[mid] ?? []) : allRegistersUnion;
                const regError = row.register_field_names.length === 0 && touchedRegRows.has(row.id);
                const isDuplicate = duplicateRowIds.has(row.id);

                return (
                  <TableRow
                    key={row.id}
                    className="merseg-row"
                    sx={isDuplicate ? { outline: '2px solid', outlineColor: 'error.main', outlineOffset: '-2px' } : undefined}
                  >
                    {/* ── Meter ── */}
                    <TableCell className="merseg-cell" data-label="Meter">
                      <FormControl fullWidth size="small" disabled={disabled || metersLoading}>
                        <Select
                          value={isAllMeters ? ALL : String(mid)}
                          onChange={e => handleMeterChange(row.id, e.target.value)}
                          displayEmpty
                          renderValue={v => {
                            if (metersLoading) return <span className="merseg-placeholder">Loading meters…</span>;
                            if (!v) return <span className="merseg-placeholder">Select meter…</span>;
                            if (v === ALL) return 'All Meters';
                            const m = meters.find(m => String(getMeterId(m)) === v);
                            return m?.name ?? v;
                          }}
                        >
                          <MenuItem value={ALL}>
                            <em>All Meters</em>
                          </MenuItem>
                          <MenuItem disabled divider />
                          {meters.map(m => (
                            <MenuItem key={getMeterId(m)} value={String(getMeterId(m))}>
                              {m.name}
                              {m.serial_number && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  {m.serial_number}
                                </Typography>
                              )}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* ── Elements ── */}
                    <TableCell className="merseg-cell" data-label="Elements">
                      {isAllMeters ? (
                        <Chip label="All Elements" size="small" className="merseg-chip merseg-chip--all" />
                      ) : elLoading ? (
                        <CircularProgress size={18} className="merseg-spinner" />
                      ) : (
                        <FormControl fullWidth size="small" disabled={disabled}>
                          <Select
                            multiple
                            value={elementSelectValue(row)}
                            onChange={e => handleElementsChange(row.id, e.target.value as string[])}
                            input={<OutlinedInput />}
                            renderValue={() => renderElementChips(row)}
                            MenuProps={{ PaperProps: { style: { maxHeight: 280 } } }}
                          >
                            <MenuItem value={ALL}>
                              <Checkbox
                                checked={row.meter_element_ids === null}
                                indeterminate={false}
                                size="small"
                              />
                              <ListItemText primary="All Elements" primaryTypographyProps={{ fontWeight: 600 }} />
                            </MenuItem>
                            {elements.length > 0 && <MenuItem disabled divider />}
                            {elements.map(el => (
                              <MenuItem key={el.meter_element_id} value={String(el.meter_element_id)}>
                                <Checkbox
                                  checked={row.meter_element_ids !== null && row.meter_element_ids.includes(el.meter_element_id)}
                                  size="small"
                                />
                                <ListItemText
                                  primary={el.element ? `${el.element} – ${el.name}` : el.name}
                                />
                              </MenuItem>
                            ))}
                            {elements.length === 0 && (
                              <MenuItem disabled>
                                <ListItemText primary="No elements available" primaryTypographyProps={{ color: 'text.secondary' }} />
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>

                    {/* ── Registers ── */}
                    <TableCell className="merseg-cell" data-label="Registers">
                      {regLoading ? (
                        <CircularProgress size={18} className="merseg-spinner" />
                      ) : (
                        <FormControl fullWidth size="small" disabled={disabled} error={regError}>
                          <Select
                            multiple
                            value={registerSelectValue(row)}
                            onChange={e => handleRegistersChange(row.id, e.target.value as string[])}
                            input={<OutlinedInput error={regError} />}
                            displayEmpty
                            renderValue={() => registerSelectValue(row).length === 0
                              ? <span className="merseg-placeholder">Select register…</span>
                              : renderRegisterChips(row)
                            }
                            MenuProps={{
                              PaperProps: { style: { maxHeight: 320, width: 420 } },
                              MenuListProps: {
                                style: { display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 0 },
                              },
                            }}
                          >
                            {registers.map(reg => (
                              <MenuItem key={reg.field_name} value={reg.field_name}>
                                <Checkbox
                                  checked={row.register_field_names.includes(reg.field_name)}
                                  size="small"
                                />
                                <ListItemText
                                  primary={reg.unit ? `${reg.name} (${reg.unit})` : reg.name}
                                />
                              </MenuItem>
                            ))}
                            {registers.length === 0 && (
                              <MenuItem disabled>
                                <ListItemText primary="No registers available" primaryTypographyProps={{ color: 'text.secondary' }} />
                              </MenuItem>
                            )}
                          </Select>
                          {regError && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                              Select at least one register
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    </TableCell>

                    {/* ── Actions ── */}
                    <TableCell className="merseg-cell merseg-cell--action" data-label="Actions">
                      {isDuplicate && (
                        <Tooltip title="This combination of meter / elements / registers overlaps with another row">
                          <Typography variant="caption" color="error" display="block" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                            Duplicate
                          </Typography>
                        </Tooltip>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Remove row">
                          <span>
                            <IconButton
                              type="button"
                              size="small"
                              onClick={() => deleteRow(row.id)}
                              disabled={disabled}
                              className="merseg-delete-btn"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Save row">
                          <span>
                            <IconButton
                              type="button"
                              size="small"
                              onClick={() => onSaveRow?.(row)}
                              disabled={disabled}
                              className="merseg-save-btn"
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

      </Paper>

      {/* Mobile-only Add button (desktop Add is in the table header) */}
      <Button
        type="button"
        size="small"
        startIcon={<AddIcon />}
        onClick={addRow}
        disabled={disabled}
        variant="text"
        className="merseg-add-btn"
      >
        Add
      </Button>

      {error && (
        <Typography variant="caption" color="error" className="merseg-error">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default MeterElementRegisterSelectorGrid;
