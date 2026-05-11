import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useTenantsEnhanced } from './tenantsStore';
import { TenantEquipmentGrid } from './TenantEquipmentGrid';
import { TenantCostsGrid } from './TenantCostsGrid';
import { TenantDocumentsGrid } from './TenantDocumentsGrid';
import { TenantPricingSidebar } from './TenantPricingSidebar';

interface TenantFormProps {
  tenant?: any;
  onCancel: () => void;
  onSubmit?: (data: any) => Promise<void>;
}

export const TenantForm: React.FC<TenantFormProps> = ({ tenant, onCancel, onSubmit }) => {
  const tenants = useTenantsEnhanced();
  const tenantId: number | undefined = tenant?.tenant_id;

  const renderTabContent = useCallback((tabName: string) => {
    if (!tenantId) {
      return (
        <Box p={3} display="flex" alignItems="center" justifyContent="center" minHeight={120}>
          <Typography variant="body2" color="text.secondary">
            Save the client first to manage {tabName.toLowerCase()}.
          </Typography>
        </Box>
      );
    }
    if (tabName === 'Equipment') return <TenantEquipmentGrid tenantId={tenantId} />;
    if (tabName === 'Costs')     return <TenantCostsGrid tenantId={tenantId} />;
    if (tabName === 'Documents') return <TenantDocumentsGrid tenantId={tenantId} />;
    return null;
  }, [tenantId]);

  return (
    <Box display="flex" sx={{ minHeight: 0 }}>
      <Box flex={1} minWidth={0}>
        <BaseForm
          schemaName="tenant"
          entity={tenant}
          store={tenants}
          onCancel={onCancel}
          onSubmit={onSubmit}
          className="tenant-form"
          showTabs={true}
          renderTabContent={renderTabContent}
        />
      </Box>
      {tenantId && <TenantPricingSidebar tenantId={tenantId} />}
    </Box>
  );
};
