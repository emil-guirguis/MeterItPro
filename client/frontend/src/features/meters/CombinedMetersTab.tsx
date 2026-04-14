import React, { useState, useEffect, useCallback, useRef } from 'react';
import { meterService, formatItemLabel, type SelectedItem, type MeterElement } from '../../services/meterService';
import './CombinedMetersTab.css';

interface MeterNode {
  meter_id: number;
  name: string;
  identifier: string;
}

interface CombinedMetersTabProps {
  meterId: string | number;
  isVirtual: boolean;
  isParentSaved: boolean;
  onMetersChange?: (selectedItems: SelectedItem[]) => void;
  onError?: (error: Error) => void;
  onParentSave?: () => Promise<void>;
}

interface DragState {
  item: SelectedItem;
  from: 'left' | 'right';
}

export const CombinedMetersTab: React.FC<CombinedMetersTabProps> = ({
  meterId,
  isParentSaved,
  onMetersChange,
  onError,
  onParentSave,
}) => {
  const [meters, setMeters] = useState<MeterNode[]>([]);
  const [elements, setElements] = useState<Record<number, MeterElement[]>>({});
  const [loadingElements, setLoadingElements] = useState<Record<number, boolean>>({});
  const [expandedMeters, setExpandedMeters] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<'left' | 'right' | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dragRef = useRef<DragState | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!isParentSaved) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      setError(null);
      const [availableMeters, savedItems] = await Promise.all([
        meterService.getMeterElements({ excludeIds: String(meterId) }),
        meterService.getVirtualMeterConfig(meterId),
      ]);
      setMeters(availableMeters.map((m) => ({
        meter_id: Number(m.id),
        name: m.name,
        identifier: m.identifier,
      })));
      setSelectedItems(savedItems);
      onMetersChange?.(savedItems);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load meters';
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setIsLoading(false);
    }
  }, [meterId, isParentSaved, onMetersChange, onError]);

  useEffect(() => { load(); }, [load]);

  // ── Element fetch on expand ───────────────────────────────────────────────

  const toggleExpand = useCallback(async (meter_id: number) => {
    setExpandedMeters((prev) => {
      const next = new Set(prev);
      if (next.has(meter_id)) { next.delete(meter_id); return next; }
      next.add(meter_id);
      return next;
    });

    if (!elements[meter_id] && !loadingElements[meter_id]) {
      setLoadingElements((prev) => ({ ...prev, [meter_id]: true }));
      try {
        const els = await meterService.getElementsForMeter(meter_id);
        setElements((prev) => ({ ...prev, [meter_id]: els }));
      } catch {
        setElements((prev) => ({ ...prev, [meter_id]: [] }));
      } finally {
        setLoadingElements((prev) => ({ ...prev, [meter_id]: false }));
      }
    }
  }, [elements, loadingElements]);

  // ── Save ─────────────────────────────────────────────────────────────────

  const persist = useCallback((items: SelectedItem[]) => {
    if (!isParentSaved) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await meterService.saveVirtualMeterConfig(meterId, items);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save';
        setError(msg);
        onError?.(err instanceof Error ? err : new Error(msg));
      } finally {
        setIsSaving(false);
      }
    }, 300);
  }, [meterId, isParentSaved, onError]);

  // ── Selection helpers ────────────────────────────────────────────────────

  const isAlreadySelected = useCallback((item: SelectedItem) => {
    return selectedItems.some((s) => s.id === item.id);
  }, [selectedItems]);

  const addItem = useCallback(async (item: SelectedItem) => {
    if (isAlreadySelected(item)) return;

    if (selectedItems.length === 0 && onParentSave) {
      try { await onParentSave(); } catch { /* ignore */ }
    }

    setSelectedItems((prev) => {
      const next = [...prev, item];
      persist(next);
      onMetersChange?.(next);
      return next;
    });
  }, [isAlreadySelected, selectedItems.length, onParentSave, persist, onMetersChange]);

  const removeItem = useCallback((item: SelectedItem) => {
    setSelectedItems((prev) => {
      const next = prev.filter((s) => s.id !== item.id);
      persist(next);
      onMetersChange?.(next);
      return next;
    });
  }, [persist, onMetersChange]);

  // ── Drag ─────────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((item: SelectedItem, from: 'left' | 'right') => {
    dragRef.current = { item, from };
    setDraggingId(item.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTargetIndex(null);
    dragRef.current = null;
  }, []);

  const handleDropOnRight = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    setDropTargetIndex(null);

    if (!dragRef.current) return;

    if (dragRef.current.from === 'left') {
      addItem(dragRef.current.item);
    } else if (dragRef.current.from === 'right' && dropTargetIndex !== null) {
      const draggedItem = dragRef.current.item;
      setSelectedItems((prev) => {
        const next = prev.filter((i) => i.id !== draggedItem.id);
        const targetId = prev[dropTargetIndex]?.id;
        let insertIdx = next.findIndex((i) => i.id === targetId);
        if (insertIdx === -1) insertIdx = next.length;
        else if (dropPosition === 'after') insertIdx += 1;
        next.splice(insertIdx, 0, draggedItem);
        persist(next);
        onMetersChange?.(next);
        return next;
      });
    }

    dragRef.current = null;
    setDraggingId(null);
  }, [addItem, dropTargetIndex, dropPosition, persist, onMetersChange]);

  const handleDropOnLeft = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    if (dragRef.current?.from === 'right') removeItem(dragRef.current.item);
    dragRef.current = null;
    setDraggingId(null);
  }, [removeItem]);

  const handleRightItemDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragRef.current?.from !== 'right') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropTargetIndex(index);
    setDropPosition(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
  }, []);

  // ── Item builders ────────────────────────────────────────────────────────

  const meterToItem = (m: MeterNode): SelectedItem => ({
    selectionType: 'meter',
    id: `meter-${m.meter_id}`,
    meter_id: m.meter_id,
    meter_name: m.name,
    identifier: m.identifier,
  });

  const elementToItem = (el: MeterElement, meterName: string): SelectedItem => ({
    selectionType: 'element',
    id: `element-${el.meter_element_id}`,
    meter_id: el.meter_id,
    meter_name: meterName,
    identifier: '',
    meter_element_id: el.meter_element_id,
    element_name: el.name,
    element: el.element,
  });

  // ── Filtering ────────────────────────────────────────────────────────────

  const q = searchQuery.toLowerCase();

  // Returns elements for a meter filtered by query (null when no query active)
  const getFilteredElements = (meter_id: number): MeterElement[] | null => {
    if (!q) return null;
    const els = elements[meter_id] || [];
    return els.filter(
      (el) => el.name.toLowerCase().includes(q) || el.element.toLowerCase().includes(q)
    );
  };

  const filteredMeters = meters.filter((m) => {
    if (!q) return true;
    if (m.name.toLowerCase().includes(q) || m.identifier.toLowerCase().includes(q)) return true;
    // Also show if any loaded elements match
    const filtered = getFilteredElements(m.meter_id);
    return filtered !== null && filtered.length > 0;
  });

  // ── States ───────────────────────────────────────────────────────────────

  if (!isParentSaved) {
    return (
      <div className="cmt cmt--disabled">
        <div className="cmt__message-box">
          <p>Save the meter first to configure combined meters.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="cmt cmt--loading">
        <div className="spinner" />
        <p>Loading meters…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cmt cmt--error">
        <div className="cmt__message-box cmt__message-box--error">
          <p>{error}</p>
          <button className="cmt__retry-btn" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="cmt">
      {/* Search */}
      <div className="cmt__search">
        <span className="material-symbols-outlined cmt__search-icon">search</span>
        <input
          type="text"
          className="cmt__search-input"
          placeholder="Search meters…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isSaving}
        />
        {searchQuery && (
          <button
            type="button"
            className="cmt__search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <div className="cmt__panels">

        {/* ── Left: Meters ── */}
        <div
          className={`cmt__panel${dragOver === 'left' ? ' cmt__panel--drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver('left'); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={handleDropOnLeft}
        >
          <div className="cmt__panel-header">
            <span className="material-symbols-outlined cmt__panel-icon">electric_meter</span>
            Available Meters
            <span className="cmt__panel-count">{filteredMeters.length}</span>
          </div>
          <div className="cmt__panel-list">
            {filteredMeters.length === 0 && (
              <div className="cmt__empty">
                <span className="material-symbols-outlined cmt__empty-icon">search_off</span>
                No meters found.
              </div>
            )}
            {filteredMeters.map((meter) => {
              const meterItem = meterToItem(meter);
              const selected = isAlreadySelected(meterItem);
              const manuallyExpanded = expandedMeters.has(meter.meter_id);
              const filteredEls = getFilteredElements(meter.meter_id);
              // Auto-expand when search matched via elements
              const searchExpandedByElements = q !== '' && filteredEls !== null && filteredEls.length > 0;
              const expanded = manuallyExpanded || searchExpandedByElements;
              const displayElements = filteredEls ?? (elements[meter.meter_id] || []);
              const loadingEl = loadingElements[meter.meter_id];

              return (
                <div key={meter.meter_id} className="cmt__meter-group">
                  {/* Meter row */}
                  <div
                    className={[
                      'cmt__meter-row',
                      selected ? 'cmt__meter-row--selected' : '',
                      draggingId === meterItem.id ? 'cmt__meter-row--dragging' : '',
                    ].filter(Boolean).join(' ')}
                    draggable={!selected}
                    onDragStart={() => handleDragStart(meterItem, 'left')}
                    onDragEnd={handleDragEnd}
                    onDoubleClick={() => addItem(meterItem)}
                    title={selected ? 'Already selected' : 'Double-click or drag to add'}
                  >
                    <button
                      type="button"
                      className={`cmt__expand-btn${expanded ? ' cmt__expand-btn--open' : ''}`}
                      onClick={() => toggleExpand(meter.meter_id)}
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <div className="cmt__meter-info">
                      <span className="cmt__meter-name">{meter.name}</span>
                      <span className="cmt__meter-id">{meter.identifier}</span>
                    </div>
                    {selected
                      ? <span className="material-symbols-outlined cmt__check-icon">check_circle</span>
                      : <span className="material-symbols-outlined cmt__drag-handle">drag_indicator</span>
                    }
                  </div>

                  {/* Elements */}
                  {expanded && (
                    <div className="cmt__elements">
                      {loadingEl && (
                        <div className="cmt__element-loading">
                          <div className="cmt__element-spinner" />
                          Loading…
                        </div>
                      )}
                      {!loadingEl && displayElements.length === 0 && (
                        <div className="cmt__element-empty">No elements defined.</div>
                      )}
                      {!loadingEl && displayElements.map((el) => {
                        const elItem = elementToItem(el, meter.name);
                        const elSelected = isAlreadySelected(elItem);
                        return (
                          <div
                            key={el.meter_element_id}
                            className={[
                              'cmt__element-row',
                              elSelected ? 'cmt__element-row--selected' : '',
                              draggingId === elItem.id ? 'cmt__element-row--dragging' : '',
                            ].filter(Boolean).join(' ')}
                            draggable={!elSelected}
                            onDragStart={() => handleDragStart(elItem, 'left')}
                            onDragEnd={handleDragEnd}
                            onDoubleClick={() => addItem(elItem)}
                            title={elSelected ? 'Already selected' : 'Double-click or drag to add'}
                          >
                            <span className="cmt__element-tag">{el.element}</span>
                            <span className="cmt__element-name">{el.name}</span>
                            {elSelected
                              ? <span className="material-symbols-outlined cmt__check-icon">check_circle</span>
                              : <span className="material-symbols-outlined cmt__drag-handle">drag_indicator</span>
                            }
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="cmt__divider">
          <span className="material-symbols-outlined">swap_horiz</span>
        </div>

        {/* ── Right: Selected ── */}
        <div
          className={`cmt__panel${dragOver === 'right' ? ' cmt__panel--drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver('right'); }}
          onDragLeave={(e) => {
            if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
              setDragOver(null);
              setDropTargetIndex(null);
            }
          }}
          onDrop={handleDropOnRight}
        >
          <div className="cmt__panel-header">
            <span className="material-symbols-outlined cmt__panel-icon">checklist</span>
            Selected
            <span className="cmt__panel-count">{selectedItems.length}</span>
            {isSaving && <span className="cmt__saving-badge">Saving…</span>}
          </div>
          <div className="cmt__panel-list">
            {selectedItems.length === 0 && (
              <div className="cmt__empty cmt__empty--drop-hint">
                <span className="material-symbols-outlined cmt__empty-icon">inbox</span>
                Drag items here or double-click to add.
              </div>
            )}
            {selectedItems.map((item, index) => {
              const isDragging = draggingId === item.id;
              const showIndicatorBefore = dropTargetIndex === index && dropPosition === 'before' && dragRef.current?.from === 'right';
              const showIndicatorAfter = dropTargetIndex === index && dropPosition === 'after' && dragRef.current?.from === 'right';

              return (
                <React.Fragment key={item.id}>
                  {showIndicatorBefore && <div className="cmt__drop-indicator" />}
                  <div
                    className={[
                      'cmt__selected-row',
                      isDragging ? 'cmt__selected-row--dragging' : '',
                    ].filter(Boolean).join(' ')}
                    draggable
                    onDragStart={() => handleDragStart(item, 'right')}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleRightItemDragOver(e, index)}
                    onDoubleClick={() => removeItem(item)}
                    title="Drag to reorder · Double-click or drag back to remove"
                  >
                    <span className="material-symbols-outlined cmt__reorder-handle">drag_indicator</span>
                    <span className="cmt__selected-name">
                      {formatItemLabel(item)}
                    </span>
                    <button
                      type="button"
                      className="cmt__remove-btn"
                      onClick={() => removeItem(item)}
                      aria-label="Remove"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  {showIndicatorAfter && <div className="cmt__drop-indicator" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

      </div>

      <div className="cmt__footer">
        {selectedItems.length === 0
          ? 'No items selected.'
          : `${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} selected`}
      </div>
    </div>
  );
};

export default CombinedMetersTab;
