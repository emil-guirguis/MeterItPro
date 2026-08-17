import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';
import { useMetersList } from '../../../hooks/useMetersList';
import './MeterElementSelector.css';

interface Element {
  meter_element_id?: number;
  id?: string;
  name: string;
  element?: string;
  element_number?: string;
  meter_id: number;
  [key: string]: any;
}

interface MeterElementSelectorProps {
  value: {
    meter_ids: string[];
    element_ids: string[];
  };
  error?: string;
  isDisabled: boolean;
  onChange: (value: { meter_ids: string[]; element_ids: string[] }) => void;
}

export const MeterElementSelector: React.FC<MeterElementSelectorProps> = ({
  value = { meter_ids: [], element_ids: [] },
  error,
  isDisabled,
  onChange,
}) => {
  const { meters, loading: metersLoading } = useMetersList();
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedMeterIds, setSelectedMeterIds] = useState<string[]>(value.meter_ids || []);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(value.element_ids || []);
  const [elementsLoading, setElementsLoading] = useState(false);
  const [elementsError, setElementsError] = useState<string | null>(null);

  // Load elements when selected meters change
  useEffect(() => {
    if (selectedMeterIds.length === 0) {
      setElements([]);
      setElementsError(null);
      return;
    }

    let mounted = true;
    setElementsLoading(true);
    setElementsError(null);

    Promise.all(
      selectedMeterIds.map(meterId =>
        apiClient.get(`/meters/${meterId}/elements`)
          .then(res => {
            const d = res.data;
            if (Array.isArray(d)) return d as Element[];
            if (d?.success && Array.isArray(d.data)) return d.data as Element[];
            return [] as Element[];
          })
          .catch(() => [] as Element[])
      )
    ).then(results => {
      if (mounted) {
        setElements(results.flat());
        setElementsLoading(false);
      }
    });

    return () => { mounted = false; };
  }, [selectedMeterIds]);

  const handleMeterToggle = (meterId: string) => {
    const newMeterIds = selectedMeterIds.includes(meterId)
      ? selectedMeterIds.filter(id => id !== meterId)
      : [...selectedMeterIds, meterId];
    setSelectedMeterIds(newMeterIds);
    onChange({ meter_ids: newMeterIds, element_ids: selectedElementIds });
  };

  const handleElementToggle = (elementId: string) => {
    const newElementIds = selectedElementIds.includes(elementId)
      ? selectedElementIds.filter(id => id !== elementId)
      : [...selectedElementIds, elementId];
    setSelectedElementIds(newElementIds);
    onChange({ meter_ids: selectedMeterIds, element_ids: newElementIds });
  };

  const getElementId = (el: Element): string =>
    String(el.meter_element_id ?? el.id ?? '');

  return (
    <div className="meter-element-selector">
      <div className="selector-section">
        <h4 className="selector-section__title">Available Meters</h4>
        {metersLoading ? (
          <div className="selector-section__loading">Loading meters...</div>
        ) : meters.length === 0 ? (
          <div className="selector-section__empty">No meters available</div>
        ) : (
          <div className="meter-list">
            {meters.map(meter => {
              const id = String(meter.meter_id ?? meter.id);
              return (
                <label key={id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedMeterIds.includes(id)}
                    onChange={() => handleMeterToggle(id)}
                    disabled={isDisabled}
                    className="checkbox-item__input"
                  />
                  <span className="checkbox-item__label">
                    {meter.name}{meter.serial_number && ` (${meter.serial_number})`}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {selectedMeterIds.length > 0 && (
        <div className="selector-section">
          <h4 className="selector-section__title">Available Elements</h4>
          {elementsError && <div className="form-error">{elementsError}</div>}
          {elementsLoading ? (
            <div className="selector-section__loading">Loading elements...</div>
          ) : elements.length === 0 ? (
            <div className="selector-section__empty">No elements available for selected meters</div>
          ) : (
            <div className="element-list">
              {elements.map(element => {
                const id = getElementId(element);
                return (
                  <label key={id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedElementIds.includes(id)}
                      onChange={() => handleElementToggle(id)}
                      disabled={isDisabled}
                      className="checkbox-item__input"
                    />
                    <span className="checkbox-item__label">
                      {element.element ? `${element.element} – ${element.name}` : element.name}
                      {element.element_number && ` (${element.element_number})`}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default MeterElementSelector;
