import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EditableDataGrid, type GridColumn } from '@framework/components/datagrid/';
import apiClient from '../../services/apiClient';
import './ElementsGrid.css';

export interface MeterElement {
  meter_element_id: number;
  meter_id: number;
  name: string;
  element: string;
  created_at?: string;
  updated_at?: string;
}

interface UnsavedMeterElement {
  name: string;
  element: string;
}

interface SchemaField {
  type: string;
  label: string;
  readOnly?: boolean;
  required?: boolean;
  enumValues?: string[];
}

interface ElementsGridProps {
  meterId: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

/**
 * Utility to extract error message from API response
 */
const extractErrorMessage = (err: any, defaultMessage: string): string => {
  const errorResponse = err?.response?.data;
  
  if (errorResponse?.errors) {
    return Object.entries(errorResponse.errors)
      .map(([, message]) => `${message}`)
      .join(', ');
  }
  
  if (errorResponse?.message) {
    return errorResponse.message;
  }
  
  if (err instanceof Error) {
    return err.message;
  }
  
  return defaultMessage;
};

export const ElementsGrid: React.FC<ElementsGridProps> = ({
  meterId,
  onError,
  onSuccess,
}) => {
  const [elements, setElements] = useState<MeterElement[]>([]);
  const [unsavedRow, setUnsavedRow] = useState<UnsavedMeterElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Record<string, SchemaField> | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, { rowId: number; column: string; value: string }>>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // Refs so getAvailableOptions always reads current values, even from a stale closure
  const elementsRef = useRef<MeterElement[]>(elements);
  elementsRef.current = elements;
  const unsavedRowRef = useRef<UnsavedMeterElement | null>(unsavedRow);
  unsavedRowRef.current = unsavedRow;

  // Debug: Log ref updates
  console.log('🔄 [ElementsGrid] Refs updated:', {
    elementsCount: elements.length,
    elements: elements.map(e => e.element),
    unsavedElement: unsavedRow?.element,
  });

  // Build columns from schema. getAvailableOptions reads refs, so it is always fresh.
  // columns needs to re-derive when schema changes OR when elements/unsavedRow change
  // so that the available options are always up-to-date
  const columns: GridColumn[] = useMemo(() => {
    if (!schema) return [];

    const allElementOptions = schema.element?.enumValues || [];

    const getAvailableOptions = (_rowId: number): string[] => {
      const usedLetters = new Set<string>(elementsRef.current.map(el => el.element.trim().toUpperCase()));
      if (unsavedRowRef.current?.element) usedLetters.add(unsavedRowRef.current.element.trim().toUpperCase());
      const available = allElementOptions.filter(opt => !usedLetters.has(opt.toUpperCase()));
      console.log('📊 [ElementsGrid] getAvailableOptions called:', {
        usedLetters: Array.from(usedLetters),
        available,
        elementsCount: elementsRef.current.length,
        elements: elementsRef.current.map(e => `"${e.element}"`),
        unsavedElement: `"${unsavedRowRef.current?.element}"`,
      });
      return available;
    };

    return [
      {
        key: 'element',
        label: schema.element?.label || 'Element',
        editable: !schema.element?.readOnly,
        type: allElementOptions.length > 0 ? 'select' : 'text',
        options: allElementOptions.length > 0 ? getAvailableOptions : undefined,
      },
      {
        key: 'name',
        label: schema.name?.label || 'Name',
        editable: !schema.name?.readOnly,
        type: 'text',
      },
    ];
  }, [schema, elements, unsavedRow]);

  // Load schema from backend
  const loadSchema = useCallback(async () => {
    try {
      const response = await apiClient.get(`/meters/${meterId}/elements/schema`);
      const schemaData = response.data.data;
      
      // Extract form fields from schema
      const formFields: Record<string, SchemaField> = {};
      if (schemaData.formFields) {
        Object.entries(schemaData.formFields).forEach(([key, fieldData]: [string, any]) => {
          formFields[key] = {
            type: fieldData.type,
            label: fieldData.label,
            readOnly: fieldData.readOnly,
            required: fieldData.required,
            enumValues: fieldData.enumValues,
          };
        });
      }
      
      setSchema(formFields);
    } catch (err) {
      console.error('Failed to load schema:', err);
      // Continue with default columns if schema fails
      setSchema({
        name: { type: 'STRING', label: 'Name', readOnly: false, required: true },
        element: { 
          type: 'STRING', 
          label: 'Element', 
          readOnly: false, 
          required: true,
          enumValues: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        },
      });
    }
  }, [meterId]);

  // Load elements from backend
  const loadElements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/meters/${meterId}/elements`);
      setElements(response.data.data || []);
      setError(null); // Clear any previous errors
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load elements';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [meterId, onError]);

  // Load schema and elements on mount
  useEffect(() => {
    loadSchema();
    loadElements();
  }, [meterId, loadSchema, loadElements]);

  // Handle add button click - insert unsaved row
  const handleAddElement = useCallback(() => {
    setUnsavedRow({
      name: '',
      element: '',
    });
  }, []);

  // Handle saving unsaved row
  const handleSaveUnsavedRow = useCallback(async () => {
    if (!unsavedRow) return;

    // Validate required fields
    const validationErrors: Record<string, string> = {};
    if (!unsavedRow.name || unsavedRow.name.trim() === '') {
      validationErrors.name = 'Name is required';
    }
    if (!unsavedRow.element || unsavedRow.element.trim() === '') {
      validationErrors.element = 'Element is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      const errorMsg = Object.values(validationErrors).join(', ');
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastSeverity('error');
      setToastOpen(true);
      return;
    }

    try {
      const response = await apiClient.post(`/meters/${meterId}/elements`, {
        name: unsavedRow.name,
        element: unsavedRow.element,
      });

      setElements([response.data.data, ...elements]);
      setUnsavedRow(null);
      setError(null);
      setToastMessage('Element added successfully');
      setToastSeverity('success');
      setToastOpen(true);
      onSuccess?.('Element added successfully');
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to add element');
      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastSeverity('error');
      setToastOpen(true);
      onError?.(new Error(errorMessage));
    }
  }, [meterId, unsavedRow, elements, onError, onSuccess]);

  // Handle cell change for unsaved row
  const handleUnsavedRowChange = useCallback((column: string, value: string) => {
    setUnsavedRow((prev) => {
      if (!prev) return null;
      return { ...prev, [column]: value };
    });
  }, []);

  // Save pending changes when cell loses focus
  const handleSavePendingChange = useCallback(
    async (rowId: number, column: string, value: string) => {
      // Adjust rowId if unsaved row exists (it's at index 0)
      const actualRowId = unsavedRow ? rowId - 1 : rowId;
      const element = elements[actualRowId];
      
      if (!element) return;

      try {
        await apiClient.put(`/meters/${meterId}/elements/${element.meter_element_id}`, {
          [column]: value,
        });
        setError(null);
        setToastMessage('Element updated successfully');
        setToastSeverity('success');
        setToastOpen(true);
        onSuccess?.('Element updated successfully');
      } catch (err) {
        // Revert on error
        const originalValue = (element as any)[column];
        const revertedElements = [...elements];
        (revertedElements[actualRowId] as any)[column] = originalValue;
        setElements(revertedElements);
        
        const errorMessage = extractErrorMessage(err, 'Failed to update element');
        setError(errorMessage);
        setToastMessage(errorMessage);
        setToastSeverity('error');
        setToastOpen(true);
        onError?.(new Error(errorMessage));
      }
    },
    [meterId, elements, unsavedRow, onError, onSuccess]
  );

  // Handle cell change for saved elements
  const handleCellChange = useCallback(
    (rowId: number, column: string, value: string) => {
      // Check if this is the unsaved row
      if (unsavedRow && rowId === 0) {
        handleUnsavedRowChange(column, value);
        return;
      }

      // Adjust rowId if unsaved row exists (it's at index 0)
      const actualRowId = unsavedRow ? rowId - 1 : rowId;
      const element = elements[actualRowId];
      
      if (!element) return;

      // Validate the change
      if (column === 'name' && (!value || value.trim() === '')) {
        setError('Name is required');
        return;
      }
      if (column === 'element' && (!value || value.trim() === '')) {
        setError('Element is required');
        return;
      }

      // Validate element uniqueness BEFORE updating
      if (column === 'element' && value) {
        const trimmedValue = value.trim().toUpperCase();
        const isDuplicate = elements.some((el) => el.meter_element_id !== element.meter_element_id && el.element.trim().toUpperCase() === trimmedValue);
        if (isDuplicate) {
          const errorMsg = `Element "${trimmedValue}" is already assigned to this meter`;
          console.log('❌ [ElementsGrid] Duplicate element detected:', errorMsg);
          setToastMessage(errorMsg);
          setToastSeverity('error');
          setToastOpen(true);
          // Don't update the value, keep the original
          return;
        }
      }

      setError(null);

      // Immediately update UI (optimistic update)
      const updatedElements = [...elements];
      (updatedElements[actualRowId] as any)[column] = value;
      setElements(updatedElements);

      // Store pending change (will be saved on blur)
      const changeKey = `${rowId}-${column}`;
      setPendingChanges((prev) => ({
        ...prev,
        [changeKey]: { rowId, column, value },
      }));

      // Don't do optimistic update here - wait for blur
    },
    [meterId, elements, unsavedRow, onError, onSuccess]
  );

  // Handle delete
  const handleDeleteElement = useCallback(async (rowId: number) => {
    const actualRowId = unsavedRow ? rowId - 1 : rowId;
    const element = elements[actualRowId];
    
    if (!element) return;

    try {
      await apiClient.delete(`/meters/${meterId}/elements/${element.meter_element_id}`);
      setElements(elements.filter((e) => e.meter_element_id !== element.meter_element_id));
      setError(null);
      setToastMessage('Element deleted successfully');
      setToastSeverity('success');
      setToastOpen(true);
      onSuccess?.('Element deleted successfully');
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to delete element');
      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastSeverity('error');
      setToastOpen(true);
      onError?.(new Error(errorMessage));
    }
  }, [meterId, elements, unsavedRow, onError, onSuccess]);

  // Build grid data with unsaved row at top
  const gridData = useMemo(() => {
    const data: any[] = [];
    
    if (unsavedRow) {
      data.push({
        id: 'unsaved',
        name: unsavedRow.name,
        element: unsavedRow.element,
        _isUnsaved: true,
      });
    }
    
    elements.forEach((element) => {
      data.push({
        meter_element_id: element.meter_element_id,
        name: element.name,
        element: element.element,
      });
    });
    
    return data;
  }, [elements, unsavedRow]);

  // Handle row delete from grid
  const handleRowDelete = useCallback((rowId: number) => {
    if (unsavedRow && rowId === 0) {
      setUnsavedRow(null);
    }
    // Delete confirmation is now handled by the framework
  }, [unsavedRow]);

  return (
    <div className="elements-grid">
      <EditableDataGrid
        data={gridData}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadElements}
        onRowAdd={handleAddElement}
        onRowDelete={handleRowDelete}
        onRowSave={(rowId) => {
          if (rowId === 0 && unsavedRow) {
            handleSaveUnsavedRow();
          }
        }}
        onCellChange={handleCellChange}
        onCellValidate={(rowId, column, value) => {
          if (column !== 'element' || !value) {
            return true;
          }

          if (unsavedRow && rowId === 0) {
            const trimmedValue = value.trim().toUpperCase();
            const isDuplicate = elements.some((el) => el.element.trim().toUpperCase() === trimmedValue);
            if (isDuplicate) {
              const errorMsg = `Element "${trimmedValue}" is already assigned to this meter`;
              setToastMessage(errorMsg);
              setToastSeverity('error');
              setToastOpen(true);
              return false;
            }
          } else {
            const actualRowId = unsavedRow ? rowId - 1 : rowId;
            const element = elements[actualRowId];
            const trimmedValue = value.trim().toUpperCase();

            if (element) {
              const isDuplicate = elements.some((el) => el.meter_element_id !== element.meter_element_id && el.element.trim().toUpperCase() === trimmedValue);
              if (isDuplicate) {
                const errorMsg = `Element "${trimmedValue}" is already assigned to this meter`;
                setToastMessage(errorMsg);
                setToastSeverity('error');
                setToastOpen(true);
                return false;
              }

              if (unsavedRow && unsavedRow.element.trim().toUpperCase() === trimmedValue) {
                const errorMsg = `Element "${trimmedValue}" is already assigned to this meter`;
                setToastMessage(errorMsg);
                setToastSeverity('error');
                setToastOpen(true);
                return false;
              }
            }
          }

          return true;
        }}
        onCellBlur={(rowId, column, value) => {
          if (unsavedRow && rowId === 0 && unsavedRow.name && unsavedRow.element) {
            handleSaveUnsavedRow();
          } else if (!unsavedRow || rowId > 0) {
            const changeKey = `${rowId}-${column}`;
            if (pendingChanges[changeKey]) {
              handleSavePendingChange(rowId, column, value);
              setPendingChanges((prev) => {
                const updated = { ...prev };
                delete updated[changeKey];
                return updated;
              });
            }
          }
        }}
        emptyMessage="No elements associated with this meter"
        addButtonLabel="Add"
        showDeleteConfirmation={true}
        onConfirmDelete={(rowId) => handleDeleteElement(rowId)}
        deleteConfirmTitle="Delete Element"
        deleteConfirmMessage="Are you sure you want to delete this element?"
        showToast={toastOpen}
        toastMessage={toastMessage}
        toastSeverity={toastSeverity}
        onToastClose={() => setToastOpen(false)}
      />
    </div>
  );
};

export default ElementsGrid;
