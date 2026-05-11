import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { TenantList } from './TenantList';
import { TenantForm } from './TenantForm';
import type { TenantEntity } from './tenantsStore';

export const TenantManagementPage: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<TenantEntity | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (tenant: TenantEntity) => {
    setSelectedTenant(tenant);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedTenant(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTenant(null);
  };

  return (
    <div className="entity-management-page">
      <TenantList onEdit={handleEdit} onCreate={handleCreate} />

      <FormModal
        isOpen={showForm}
        title={selectedTenant ? 'Edit Client' : 'New Client'}
        onClose={handleFormClose}
        showSaveButton={true}
        size="md"
      >
        {showForm && (
          <TenantForm
            key={selectedTenant?.tenant_id ? `edit-${selectedTenant.tenant_id}` : 'new'}
            tenant={selectedTenant ?? undefined}
            onCancel={handleFormClose}
          />
        )}
      </FormModal>
    </div>
  );
};
