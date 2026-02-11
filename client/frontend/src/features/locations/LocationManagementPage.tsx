import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { LocationList } from './LocationList';
import { LocationForm } from './LocationForm';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { Location } from '../../types/entities';

export const LocationManagementPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedLocation(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedLocation(null);
  };

  return (
    <AppLayoutWrapper title="Location Management">
      <div className="entity-management-page">
        <LocationList
          onLocationEdit={handleEdit}
          onLocationCreate={handleCreate}
        />

        <FormModal
          isOpen={showForm}
          title="Location"
          onClose={handleFormClose}
          showSaveButton={true}
          saveLabel="Save"
          size="md"
        >
          {showForm && (
            <LocationForm
              key={selectedLocation?.location_id ? `edit-${selectedLocation.location_id}` : 'new'}
              location={selectedLocation || undefined}
              onCancel={handleFormClose}
            />
          )}
        </FormModal>
      </div>
    </AppLayoutWrapper>
  );
};
