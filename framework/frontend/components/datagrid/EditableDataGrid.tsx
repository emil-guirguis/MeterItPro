import React, { useState, useCallback, useRef } from 'react';
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import './EditableDataGrid.css';

export interface GridColumn {
  key: string;
  label: string;
  editable?: boolean;
  type?: 'text' | 'number' | 'select';
  width?: string;
  options?: string[] | ((rowId: number) => string[]);
}

export interface EditableDataGridProps {
  data: Record<string, any>[];
  columns: GridColumn[];
  onRowAdd?: () => void;
  onRowDelete?: (rowId: number) => void;
  onRowSave?: (rowId: number) => void;
  onCellChange?: (rowId: number, column: string, value: any) => void;
  onCellBlur?: (rowId: number, column: string, value: any) => void;
  onCellValidate?: (rowId: number, column: string, value: any) => boolean; // Returns true if valid
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  addButtonLabel?: string;
  
  // Delete confirmation support
  showDeleteConfirmation?: boolean;
  onConfirmDelete?: (rowId: number) => Promise<void>;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  
  // Toast notification support
  showToast?: boolean;
  toastMessage?: string;
  toastSeverity?: 'success' | 'error';
  onToastClose?: () => void;

  // Visibility controls
  hideAddButton?: boolean;
  hideDeleteColumn?: boolean;
}

interface EditingCell {
  rowId: number;
  column: string;
}

export const EditableDataGrid: React.FC<EditableDataGridProps> = ({
  data,
  columns,
  onRowAdd,
  onRowDelete,
  onRowSave,
  onCellChange,
  onCellBlur,
  onCellValidate,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No data available',
  addButtonLabel = 'Add',
  showDeleteConfirmation = false,
  onConfirmDelete,
  deleteConfirmTitle = 'Delete Row',
  deleteConfirmMessage = 'Are you sure you want to delete this row?',
  showToast = false,
  toastMessage = '',
  toastSeverity = 'success',
  onToastClose,
  hideAddButton = false,
  hideDeleteColumn = false,
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const selectRef = useRef<HTMLSelectElement>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);
  const [selectPosition, setSelectPosition] = useState<{ top: number; left: number } | null>(null);
  const [deleteConfirmRowId, setDeleteConfirmRowId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resolve options inline every render so ref-backed functions always return current values
  const floatingSelectOptions = (() => {
    if (!editingCell) return null;
    const editingColumn = columns.find(c => c.key === editingCell.column);
    const raw = editingColumn?.options;
    if (!raw) return null;
    return typeof raw === 'function' ? raw(editingCell.rowId) : raw;
  })();

  const handleCellClick = useCallback(
    (rowId: number, column: GridColumn) => {
      if (column.editable !== false) {
        const cellValue = data[rowId]?.[column.key] ?? '';
        const trimmedValue = String(cellValue).trim();
        setEditingCell({ rowId, column: column.key });
        setEditValue(trimmedValue);
      }
    },
    [data]
  );

  // Calculate select position when editing a select cell
  React.useEffect(() => {
    if (editingCell && cellRef.current) {
      const column = columns.find(col => col.key === editingCell.column);
      if (column?.type === 'select') {
        const rect = cellRef.current.getBoundingClientRect();
        setSelectPosition({
          top: rect.top - 200,
          left: rect.left,
        });
      }
    } else {
      setSelectPosition(null);
    }
  }, [editingCell, columns]);

  const handleCellChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const handleCellSave = useCallback((valueOverride?: string) => {
    if (editingCell && onCellChange) {
      const finalValue = (valueOverride !== undefined ? valueOverride : editValue).trim();
      onCellChange(editingCell.rowId, editingCell.column, finalValue);
      onCellBlur?.(editingCell.rowId, editingCell.column, finalValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, onCellChange, onCellBlur]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteConfirmRowId !== null && onConfirmDelete) {
      setIsDeleting(true);
      try {
        await onConfirmDelete(deleteConfirmRowId);
      } finally {
        setIsDeleting(false);
        setDeleteConfirmRowId(null);
      }
    }
  }, [deleteConfirmRowId, onConfirmDelete]);

  const handleDeleteClick = useCallback((rowId: number) => {
    if (showDeleteConfirmation) {
      setDeleteConfirmRowId(rowId);
    } else {
      onRowDelete?.(rowId);
    }
  }, [showDeleteConfirmation, onRowDelete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        // Check if this is the last column
        if (editingCell) {
          const lastColumnKey = columns[columns.length - 1]?.key;
          if (editingCell.column === lastColumnKey && data[editingCell.rowId]?._isUnsaved) {
            // For unsaved rows on the last column, trigger save
            onRowSave?.(editingCell.rowId);
          } else {
            // For other columns, just save the cell
            handleCellSave();
          }
        }
      } else if (e.key === 'Escape') {
        handleCellCancel();
      }
    },
    [handleCellSave, handleCellCancel, editingCell, columns, data, onRowSave]
  );

  const isEditing = (rowId: number, column: string) =>
    editingCell?.rowId === rowId && editingCell?.column === column;

  return (
    <Box className="editable-data-grid">
      {/* Header with Add Button */}
      {!hideAddButton && (
        <Box className="editable-data-grid__header">
          <Button
            variant="contained"
            color="primary"
            onClick={onRowAdd}
            disabled={loading || !onRowAdd}
            className="editable-data-grid__add-button"
          >
            {addButtonLabel}
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              className="editable-data-grid__loading"
            />
          )}
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert
          severity="error"
          onClose={onRetry ? () => onRetry() : undefined}
          className="editable-data-grid__error"
        >
          {error}
          {onRetry && (
            <Button
              size="small"
              onClick={onRetry}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          )}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} className="editable-data-grid__table">
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  style={{ width: column.width }}
                  className="editable-data-grid__header-cell"
                >
                  {column.label}
                </TableCell>
              ))}
              {!hideDeleteColumn && (
                <TableCell
                  style={{ width: '60px' }}
                  className="editable-data-grid__header-cell"
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={hideDeleteColumn ? columns.length : columns.length + 1}
                  align="center"
                  className="editable-data-grid__empty"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => {
                // Generate stable key from row data
                const rowKey = row.id ? String(row.id) : `row-${rowIndex}-${JSON.stringify(row).substring(0, 20)}`;
                return (
                <TableRow
                  key={rowKey}
                  className={`editable-data-grid__row ${row._isUnsaved ? '_unsaved' : ''}`}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowIndex}-${column.key}`}
                      ref={isEditing(rowIndex, column.key) ? cellRef : null}
                      onClick={() => handleCellClick(rowIndex, column)}
                      data-select-cell={column.type === 'select' ? 'true' : 'false'}
                      data-row-id={rowIndex}
                      data-column={column.key}
                      className={`editable-data-grid__cell ${
                        column.editable !== false
                          ? 'editable-data-grid__cell--editable'
                          : ''
                      } ${
                        isEditing(rowIndex, column.key)
                          ? `editable-data-grid__cell--editing ${column.type === 'select' ? 'editable-data-grid__cell--editing-select' : ''}`
                          : ''
                      }`}
                    >
                      {isEditing(rowIndex, column.key) ? (
                        <>
                          {column.type === 'select' && column.options ? (
                            <div style={{ visibility: 'hidden', height: '0' }}>
                              {/* Hidden select - floating select is rendered below */}
                            </div>
                          ) : (
                            <TextField
                              autoFocus
                              value={editValue}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCellChange(e.target.value)}
                              onBlur={() => handleCellSave()}
                              onKeyDown={handleKeyDown}
                              size="small"
                              variant="outlined"
                              fullWidth
                              className="editable-data-grid__input"
                            />
                          )}
                        </>
                      ) : (
                        <div className="editable-data-grid__cell-content">
                          <span>{row[column.key]}</span>
                          {column.type === 'select' && <span className="editable-data-grid__cell-dropdown-icon">▼</span>}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  {!hideDeleteColumn && (
                    <TableCell
                      align="center"
                      className="editable-data-grid__actions-cell"
                    >
                      {row._isUnsaved ? (
                        <IconButton
                          size="small"
                          onClick={() => onRowSave?.(rowIndex)}
                          className="editable-data-grid__save-button"
                          title="Save row"
                          color="success"
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(rowIndex)}
                          className="editable-data-grid__delete-button"
                          title="Delete row"
                          color="error"
                          disabled={!onRowDelete}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Floating Select Dropdown */}
      {selectPosition && editingCell && floatingSelectOptions && (
        <select
          ref={selectRef}
          autoFocus
          value={editValue}
          aria-label="Select element"
          onChange={(e) => {
            const newValue = e.target.value;
            console.log('📝 [EditableDataGrid] Floating select onChange:', { newValue, editingCell });
            
            // Validate before saving
            if (editingCell && onCellValidate) {
              const isValid = onCellValidate(editingCell.rowId, editingCell.column, newValue);
              if (!isValid) {
                // Validation failed - keep select open, reset to previous value
                // The toast is already shown by onCellValidate
                console.log('❌ [EditableDataGrid] Validation failed, keeping select open');
                setEditValue(editValue);
                // Re-focus the select to keep it open
                setTimeout(() => {
                  selectRef.current?.focus();
                }, 50);
                return;
              }
            }
            
            // Save immediately after selection
            if (editingCell && onCellChange) {
              onCellChange(editingCell.rowId, editingCell.column, newValue);
              onCellBlur?.(editingCell.rowId, editingCell.column, newValue);
            }
            
            // Auto-focus next column after successful validation
            if (editingCell) {
              const currentColumnIndex = columns.findIndex(col => col.key === editingCell.column);
              const nextColumn = columns[currentColumnIndex + 1];
              
              if (nextColumn && nextColumn.editable !== false) {
                // Focus the next column
                setTimeout(() => {
                  const nextCell = document.querySelector(
                    `[data-row-id="${editingCell.rowId}"][data-column="${nextColumn.key}"]`
                  ) as HTMLElement;
                  if (nextCell) {
                    nextCell.click();
                  }
                }, 50);
              }
            }
            
            // Clear editing state
            setEditingCell(null);
            setEditValue('');
          }}
          onBlur={() => {
            setEditingCell(null);
            setEditValue('');
          }}
          className="editable-data-grid__select"
          style={{
            position: 'fixed',
            top: `${selectPosition.top}px`,
            left: `${selectPosition.left}px`,
            width: '200px',
            padding: '8px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '2px solid #1976d2',
            borderRadius: '4px',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          size={Math.min(10, floatingSelectOptions.length + 1)}
          title="Select element"
        >
          <option value="">Select...</option>
          {floatingSelectOptions.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <Dialog
          open={deleteConfirmRowId !== null}
          onClose={() => setDeleteConfirmRowId(null)}
        >
          <DialogTitle>{deleteConfirmTitle}</DialogTitle>
          <DialogContent>{deleteConfirmMessage}</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmRowId(null)}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              disabled={isDeleting}
            >
              {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Toast Notification */}
      {showToast && (
        <Snackbar
          open={showToast}
          autoHideDuration={4000}
          onClose={onToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={onToastClose}
            severity={toastSeverity}
            sx={{ width: '100%' }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default EditableDataGrid;
