import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { LocationList } from './LocationList';
import { LocationForm } from './LocationForm';
import type { Location } from '../../types/entities';

export const LocationManagementPage: React.FC = () => (
  <EntityManagementPage<Location>
    title="Location"
    moduleIcon="building"
    renderList={({ onEdit, onCreate }) => (
      <LocationList onLocationEdit={onEdit} onLocationCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => (
      <LocationForm location={entity} onCancel={onCancel} />
    )}
  />
);
