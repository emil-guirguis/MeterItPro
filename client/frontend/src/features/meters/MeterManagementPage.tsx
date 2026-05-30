import React from 'react';
import { EntityManagementPage } from '@framework/components/entity';
import { AppLayoutWrapper } from '../../components/layout/AppLayoutWrapper';
import { MeterList } from './MeterList';
import { MeterForm } from './MeterForm';
import type { Meter } from './metersStore';

export const MeterManagementPage: React.FC = () => (
  <AppLayoutWrapper title="Meter Management">
    <EntityManagementPage<Meter>
      title="Meter"
      moduleIcon="meter"
      modalSize="xl"
      renderList={({ onEdit, onCreate }) => (
        <MeterList onMeterEdit={onEdit} onMeterCreate={onCreate} />
      )}
      renderForm={({ entity, onCancel }) => (
        <MeterForm meter={entity} onCancel={onCancel} />
      )}
    />
  </AppLayoutWrapper>
);
