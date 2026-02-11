import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { AppLayoutWrapper } from '../../components/layout/AppLayoutWrapper';
import { MeterList } from './MeterList';
import { MeterForm } from './MeterForm';
import type { Meter } from './metersStore';

export const MeterManagementPage: React.FC = () => {
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedMeter(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedMeter(null);
  };

  return (
    <AppLayoutWrapper title="Meter Management">
      <div className="entity-management-page">
        <MeterList
          onMeterEdit={handleEdit}
          onMeterCreate={handleCreate}
        />

        <FormModal
          isOpen={showForm}
          title="Meter"
          onClose={handleFormClose}
          showSaveButton={true}
          saveLabel="Save"
          size="xl"
        >
          {showForm && (
            <MeterForm
              key={selectedMeter?.meter_id ? `edit-${selectedMeter.meter_id}` : 'new'}
              meter={selectedMeter || undefined}
              onCancel={handleFormClose}
            />
          )}
        </FormModal>
      </div>
    </AppLayoutWrapper>
  );
};
