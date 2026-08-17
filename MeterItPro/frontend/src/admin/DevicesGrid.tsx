import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EditableDataGrid, type GridColumn, useGridToast, useUnsavedRow } from '@meterit/framework-frontend/components/datagrid/';
import { listDeviceCatalog, createDevice, updateDevice, deleteDevice, type DeviceCatalog } from './adminService';

const DEVICE_TYPES = ['Electric', 'Gas', 'Water', 'Steam', 'Other'];

const NEW_ROW_DEFAULTS = {
  manufacturer:  '',
  model_number:  '',
  description:   '',
  type:          'Electric',
  number_of_elements:  '0',
  default_price:  '0',
};

const COLUMNS: GridColumn[] = [
  { key: 'manufacturer', label: 'Manufacturer', type: 'text',   width: '18%' },
  { key: 'model_number', label: 'Model Number', type: 'text',   width: '18%' },
  { key: 'description',  label: 'Description',  type: 'text',   width: '22%' },
  { key: 'type',         label: 'Type',         type: 'select', width: '12%', options: DEVICE_TYPES },
  { key: 'number_of_elements', label: '# Elements',   type: 'number', width: '12%' },
  { key: 'default_price', label: 'Default Cost', type: 'number', width: '12%' },
];

function toApiValue(column: string, value: string): any {
  if (column === 'number_of_elements') return parseInt(value, 10)  || 0;
  if (column === 'default_price') return parseFloat(value)    || 0;
  return value;
}

function toGridRow(item: DeviceCatalog): Record<string, any> {
  return {
    id:            item.device_id,
    manufacturer:  item.manufacturer,
    model_number:  item.model_number,
    description:   item.description,
    type:          item.type,
    number_of_elements:  String(item.number_of_elements),
    default_price:  String(item.default_price),
  };
}

export const DevicesGrid: React.FC = () => {
  const [items, setItems]     = useState<DeviceCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const { toastProps, showSuccess, showError } = useGridToast();

  const {
    unsavedRow,
    itemsRef,
    hasUnsaved,
    handleAddRow,
    handleRowDelete,
    updateUnsavedField,
    clearUnsaved,
    getActualRowId,
  } = useUnsavedRow(items, NEW_ROW_DEFAULTS);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listDeviceCatalog());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const gridData = useMemo(() => {
    const rows: Record<string, any>[] = [];
    if (unsavedRow) {
      rows.push({ id: 'unsaved', ...unsavedRow, _isUnsaved: true });
    }
    items.forEach(item => rows.push(toGridRow(item)));
    return rows;
  }, [items, unsavedRow]);

  const handleSaveUnsaved = useCallback(async () => {
    if (!unsavedRow?.manufacturer?.trim() || !unsavedRow?.model_number?.trim()) {
      showError('Manufacturer and model number are required');
      return;
    }
    try {
      await createDevice({
        manufacturer:  unsavedRow.manufacturer,
        model_number:  unsavedRow.model_number,
        description:   unsavedRow.description,
        type:          unsavedRow.type,
        number_of_elements:  parseInt(unsavedRow.number_of_elements, 10)  || 0,
        default_price:  parseFloat(unsavedRow.default_price)    || 0,
      });
      clearUnsaved();
      showSuccess('Device created');
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Save failed');
    }
  }, [unsavedRow, clearUnsaved, showSuccess, showError, load]);

  const handleCellChange = useCallback((rowId: number, column: string, value: string) => {
    if (hasUnsaved && rowId === 0) {
      updateUnsavedField(column, value);
      return;
    }
    const actualRowId = getActualRowId(rowId);
    setItems(prev => {
      const updated = [...prev];
      if (updated[actualRowId]) {
        updated[actualRowId] = { ...updated[actualRowId], [column]: toApiValue(column, value) };
      }
      return updated;
    });
  }, [hasUnsaved, getActualRowId, updateUnsavedField]);

  const handleCellBlur = useCallback(async (rowId: number, column: string, value: string) => {
    if (hasUnsaved && rowId === 0) return;
    const actualRowId = getActualRowId(rowId);
    const item = itemsRef.current[actualRowId];
    if (!item) return;
    try {
      await updateDevice(item.device_id, { [column]: toApiValue(column, value) });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Update failed');
      await load();
    }
  }, [hasUnsaved, getActualRowId, itemsRef, showError, load]);

  const handleConfirmDelete = useCallback(async (rowId: number) => {
    const actualRowId = getActualRowId(rowId);
    const item = itemsRef.current[actualRowId];
    if (!item) return;
    await deleteDevice(item.device_id);
    await load();
  }, [getActualRowId, itemsRef, load]);

  return (
    <EditableDataGrid
      data={gridData}
      columns={COLUMNS}
      loading={loading}
      error={error}
      onRetry={load}
      onRowAdd={handleAddRow}
      onRowDelete={(rowId) => { handleRowDelete(rowId); }}
      onRowSave={(rowId) => { if (rowId === 0 && unsavedRow) void handleSaveUnsaved(); }}
      onRowCancel={(rowId) => { if (rowId === 0) clearUnsaved(); }}
      onCellChange={handleCellChange}
      onCellBlur={(rowId, column, value) => { void handleCellBlur(rowId, column, String(value)); }}
      emptyMessage="No devices in catalog"
      addButtonLabel="Device"
      showDeleteConfirmation
      onConfirmDelete={handleConfirmDelete}
      deleteConfirmTitle="Delete Device"
      deleteConfirmMessage="Delete this device from the catalog? This will affect any tenants using it."
      {...toastProps}
    />
  );
};
