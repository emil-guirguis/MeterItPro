/**
 * Location Form
 * 
 * Uses the dynamic schema-based BaseForm to render the location form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the location schema.
 */

import React from 'react';
import { BaseForm } from '@meterit/framework-frontend/components/form/BaseForm';
import { useSchema } from '@meterit/framework-frontend/components/form/utils/schemaLoader';
import { useLocationsEnhanced } from './locationsStore';
import type { Location } from '../../types/entities';

interface LocationFormProps {
  location?: Location;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const locations = useLocationsEnhanced();

  // Use schema from cache (prefetched at login)
  const { schema: _schema } = useSchema('location');

  return (
    <BaseForm
      schemaName="location"
      entity={location}
      store={locations}
      onCancel={onCancel}
      onSubmit={onSubmit}
      className="location-form"
      loading={loading}
      showTabs={true}
    />
  );
};

export default LocationForm;
