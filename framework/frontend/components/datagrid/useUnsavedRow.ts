import { useState, useRef, useCallback, useMemo } from 'react';

export function useUnsavedRow<TItem, TUnsaved extends Record<string, any>>(
  items: TItem[],
  newRowDefaults: TUnsaved,
) {
  const [unsavedRow, setUnsavedRow] = useState<TUnsaved | null>(null);

  // Refs for use inside closures/options functions without stale captures
  const itemsRef = useRef<TItem[]>(items);
  itemsRef.current = items;
  const unsavedRef = useRef<TUnsaved | null>(unsavedRow);
  unsavedRef.current = unsavedRow;
  const defaultsRef = useRef<TUnsaved>(newRowDefaults);

  const hasUnsaved = !!unsavedRow;

  const handleAddRow = useCallback(() => {
    setUnsavedRow({ ...defaultsRef.current });
  }, []);

  // Returns true if the unsaved row was handled — caller should skip further processing
  const handleRowDelete = useCallback((rowId: number): boolean => {
    if (unsavedRef.current !== null && rowId === 0) {
      setUnsavedRow(null);
      return true;
    }
    return false;
  }, []);

  const updateUnsavedField = useCallback((column: string, value: string) => {
    setUnsavedRow(prev => (prev ? { ...prev, [column]: value } : null));
  }, []);

  const clearUnsaved = useCallback(() => setUnsavedRow(null), []);

  // Translates a grid rowId (0-based, unsaved row at 0 when present) to items[] index
  const getActualRowId = useCallback((rowId: number): number => {
    return unsavedRef.current !== null ? rowId - 1 : rowId;
  }, []);

  return {
    unsavedRow,
    unsavedRef,
    itemsRef,
    hasUnsaved,
    handleAddRow,
    handleRowDelete,
    updateUnsavedField,
    clearUnsaved,
    getActualRowId,
  };
}
