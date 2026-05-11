import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { CostList } from '../CostList';
import { CostForm } from '../CostForm';
import type { CostEntity } from '../costsStore';

const CostsPage: React.FC = () => {
  const [selected, setSelected] = useState<CostEntity | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (cost: CostEntity) => {
    setSelected(cost);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelected(null);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };

  return (
    <div className="entity-management-page">
      <CostList onEdit={handleEdit} onCreate={handleCreate} />
      <FormModal
        isOpen={showForm}
        title={selected ? 'Edit Cost' : 'New Cost'}
        onClose={handleClose}
        showSaveButton={true}
        size="sm"
      >
        {showForm && (
          <CostForm
            key={selected?.cost_id ? `edit-${selected.cost_id}` : 'new'}
            cost={selected ?? undefined}
            onCancel={handleClose}
          />
        )}
      </FormModal>
    </div>
  );
};

export default CostsPage;
