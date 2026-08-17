import React from 'react';
import { BaseForm } from '@meterit/framework-frontend/components/form/BaseForm';
import { useCostsEnhanced } from './costsStore';

interface CostFormProps {
  cost?: any;
  onCancel: () => void;
}

export const CostForm: React.FC<CostFormProps> = ({ cost, onCancel }) => {
  const costs = useCostsEnhanced();
  return (
    <BaseForm
      schemaName="cost"
      entity={cost}
      store={costs}
      onCancel={onCancel}
      showTabs={true}
    />
  );
};
