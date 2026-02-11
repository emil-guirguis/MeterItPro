import React, { useState } from 'react';
import { MeterList, MeterForm } from '../features/meters';
import { MeterTypeSelector } from '../features/meters/MeterTypeSelector';
import { useMetersEnhanced, type Meter } from '../features/meters/metersStore';
import { FormModal } from '@framework/components/modal';
import './MetersPage.css';

type ViewMode = 'list' | 'create' | 'edit' | 'view';
type MeterType = 'physical' | 'virtual' | null;

const MetersPage: React.FC = () => {
  const meters = useMetersEnhanced();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedMeterType, setSelectedMeterType] = useState<MeterType>(null);

  const handleCreateMeter = () => {
    setShowTypeSelector(true);
  };

  const handleMeterTypeSelected = (type: 'physical' | 'virtual') => {
    setSelectedMeterType(type);
    setShowTypeSelector(false);
    setSelectedMeter(null);
    setViewMode('create');
  };

  const handleTypeSelectionCancel = () => {
    setShowTypeSelector(false);
    setSelectedMeterType(null);
  };

  const handleEditMeter = (meter: any) => {
    setSelectedMeter(meter);
    setViewMode('edit');
  };

  const handleViewMeter = (meter: any) => {
    setSelectedMeter(meter);
    setViewMode('view');
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (viewMode === 'create') {
        await meters.createMeter(data);
      } else if (viewMode === 'edit' && selectedMeter) {
        await meters.updateMeter(String(selectedMeter.meter_id), data);
      }
      setViewMode('list');
      setSelectedMeter(null);
    } catch (error) {
      console.error('Meter form submission error:', error);
      // Error handling is already done in the store with notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedMeter(null);
    setSelectedMeterType(null);
  };

  const renderMeterDetails = (meter: Meter) => (
    <div className="meter-details">
      <div className="meter-details__header">
        <h3>{meter.meterId}</h3>
        <div className="meter-details__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => handleEditMeter(meter)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setViewMode('list')}
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="meter-details__content">
        <div className="detail-section">
          <h4>Basic Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Device:</label>
              <span>{meter.device}</span>
            </div>
            <div className="detail-item">
              <label>Model:</label>
              <span>{meter.model}</span>
            </div>
            <div className="detail-item">
              <label>Serial Number:</label>
              <span>{meter.serialNumber}</span>
            </div>
            <div className="detail-item">
              <label>Type:</label>
              <span className={`badge badge--${meter.type === 'electric' ? 'primary' : meter.type === 'gas' ? 'warning' : 'info'}`}>
                {meter.type}
              </span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={`status-indicator status-indicator--${meter.status}`}>
                <span className={`status-dot status-dot--${meter.status}`}></span>
                {meter.status}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Connection Settings</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>IP Address:</label>
              <span>{meter.ip}</span>
            </div>
            <div className="detail-item">
              <label>Port:</label>
              <span>{meter.portNumber}</span>
            </div>
            <div className="detail-item">
              <label>Protocol:</label>
              <span>TCP</span>
            </div>
          </div>
        </div>

        {(meter.location || meter.description) && (
          <div className="detail-section">
            <h4>Location & Description</h4>
            <div className="detail-grid">
              {meter.location && (
                <div className="detail-item detail-item--full">
                  <label>Location:</label>
                  <span>{meter.location}</span>
                </div>
              )}
              {meter.description && (
                <div className="detail-item detail-item--full">
                  <label>Description:</label>
                  <span>{meter.description}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h4>Last Reading</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Value:</label>
              <span>No readings available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="meters-page">
      <div className="page-content">
        {viewMode === 'list' && (
          <MeterList
            onMeterCreate={handleCreateMeter}
            onMeterEdit={handleEditMeter}
            onMeterSelect={handleViewMeter}
          />
        )}

        {viewMode === 'view' && selectedMeter && renderMeterDetails(selectedMeter)}
      </div>

      {/* Meter Type Selector Dialog */}
      <MeterTypeSelector
        isOpen={showTypeSelector}
        onSelect={handleMeterTypeSelected}
        onCancel={handleTypeSelectionCancel}
      />

      {/* Create/Edit Modal */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <FormModal
          isOpen={true}
          title="Meter"
          onClose={handleFormCancel}
          onSubmit={() => { }} // No-op since form handles its own submission
          size="lg"
          showSaveButton={true}
          saveLabel="Save"
        >
          <MeterForm
            meter={selectedMeter || undefined}
            meterType={selectedMeterType}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={isSubmitting}
          />
        </FormModal>
      )}
    </div>
  );
};

export default MetersPage;
