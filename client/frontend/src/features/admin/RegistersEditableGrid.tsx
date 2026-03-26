import React, { useState, useEffect, useCallback } from 'react';
import { EditableDataGrid, type GridColumn } from '@framework/components/datagrid/';
import apiClient from '../../services/apiClient';
import './RegistersEditableGrid.css';

export interface Register {
  register_id: number;
  register: number;
  name: string;
  unit: string;
  field_name: string;
  description?: string;
}

interface RegistersEditableGridProps {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export const RegistersEditableGrid: React.FC<RegistersEditableGridProps> = ({
  onError,
  onSuccess,
}) => {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Column definitions - description is now editable
  const columns: GridColumn[] = [
    { key: 'register', label: 'Register Number', editable: true, type: 'number' },
    { key: 'name', label: 'Name', editable: true, type: 'text' },
    { key: 'unit', label: 'Unit', editable: true, type: 'text' },
    { key: 'field_name', label: 'Field Name', editable: true, type: 'text' },
    { key: 'description', label: 'Description', editable: true, type: 'text' },
  ];

  const loadRegisters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/registers');
      setRegisters(response.data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load registers';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadRegisters();
  }, [loadRegisters]);

  const handleCellChange = async (rowIdx: number, key: string, value: any) => {
    const updatedRegister = { ...registers[rowIdx], [key]: value };
    const newRegisters = [...registers];
    newRegisters[rowIdx] = updatedRegister;
    setRegisters(newRegisters);

    try {
      // Update via API
      await apiClient.put(`/registers/${updatedRegister.register_id}`, updatedRegister);
      onSuccess?.(`Register ${updatedRegister.name} updated successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update register';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
      // Revert changes on error
      loadRegisters();
    }
  };

  const handleRowDelete = async (rowIdx: number) => {
    // Delete is disabled - show message instead
    onError?.(new Error('Register deletion is not allowed. Please contact an administrator.'));
  };

  const handleRowAdd = (newRow: any) => {
    // Add new register via API
    apiClient
      .post('/registers', newRow)
      .then(() => {
        loadRegisters();
        onSuccess?.('Register created successfully');
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create register';
        onError?.(new Error(errorMessage));
      });
  };

  return (
    <div className="registers-editable-grid">
      <h2>Register Management</h2>
      <EditableDataGrid
        data={registers}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadRegisters}
        onCellChange={handleCellChange}
        onRowAdd={handleRowAdd}
        onRowDelete={handleRowDelete}
        emptyMessage="No registers found"
      />
    </div>
  );
};

export default RegistersEditableGrid;
