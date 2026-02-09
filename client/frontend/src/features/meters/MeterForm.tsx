/**
 * Meter Form
 * 
 * Uses the dynamic schema-based BaseForm to render the meter form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Fields are automatically organized into tabs and sections based on formGrouping metadata.
 */

import React, { useCallback, useState } from 'react';
import { BaseForm, FormContainer } from '@framework/components/form';
import { useMetersEnhanced, type Meter } from './metersStore';
import { useValidationDataProvider } from '../../hooks/useValidationDataProvider';
import { ElementsGrid } from './ElementsGrid';
import { CombinedMetersTab } from './CombinedMetersTab';
import './MeterForm.css';

interface MeterFormProps {
  meter?: Meter;
  meterType?: 'physical' | 'virtual' | null;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  meterType,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const meters = useMetersEnhanced();
  const baseValidationDataProvider = useValidationDataProvider();
  const [isParentSaved, setIsParentSaved] = useState(!!meter?.meter_id);
  // Selected type state for create flow so users can always choose meter type
  const [selectedType, setSelectedType] = useState<'physical' | 'virtual' | null>(
    meter?.meter_type || meter?.type || meterType || 'physical'
  );
  

  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

  // Handle parent meter save
  const handleParentSave = useCallback(async () => {
    // This will be called when the first meter is selected in CombinedMetersTab
    // The parent meter should already be saved by this point
    setIsParentSaved(true);
  }, []);

  // Determine meter type from meter object or selectedType state
  const determinedMeterType = meter?.meter_type || meter?.type || selectedType || null;

  // Determine if meter is virtual (check both possible property names + selectedType)
  const isVirtual =
    meter?.meter_type === 'virtual' ||
    meter?.type === 'virtual' ||
    selectedType === 'virtual' ||
    meterType === 'virtual';
  const meterId = meter?.meter_id || meter?.id;
  // Default installation date to today for create flow
  const todayIsoDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const initialEntity = meter ?? { installation_date: todayIsoDate };

  return (
    <FormContainer>
      <div className="form-container__content">
        {/* Always show a meter type selector for create flow so user can set physical/virtual */}
        {!meter && (
          <div className="meter-type-selector" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Meter Type</label>
            <select
              value={selectedType || 'physical'}
              onChange={(e) => setSelectedType(e.target.value as 'physical' | 'virtual')}
              disabled={loading}
            >
              <option value="physical">Physical</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
        )}
        <BaseForm
          schemaName="meter"
          entity={initialEntity}
          store={meters}
          onCancel={onCancel}
          onSubmit={onSubmit}
          className={`meter-form ${isVirtual ? 'meter-form--virtual' : 'meter-form--physical'}`}
          loading={loading}
          validationDataProvider={validationDataProvider}
          showTabs={true}
          meterType={determinedMeterType}
          // Keep framework-managed connection fields excluded for virtual meters,
          // but allow the `elements` field to be rendered so `renderCustomField`
          // can provide the custom ElementsGrid / CombinedMetersTab UI.
          excludeFields={isVirtual ? ['serial_number', 'device_id', 'ip', 'port'] : []}
          fieldsToClean={['id', 'elements']}
          renderCustomField={(fieldName, _fieldDef, _value, _error, _isDisabled, _onChange) => {
            console.log(`[MeterForm] renderCustomField - fieldName: ${fieldName}`, {
              meter_id: meter?.meter_id,
              id: meter?.id,
              meter: meter,
              hasMeterId: !!meter?.meter_id,
              isVirtual,
            });
            
            // When rendering the "elements" field, show ElementsGrid for physical meters or CombinedMetersTab for virtual meters
            if (fieldName === 'elements') {
              console.log(`[MeterForm] Rendering elements field`, {
                meter_id: meterId,
                isVirtual,
                shouldRenderGrid: !!meterId,
              });
              
              if (!meterId) {
                console.log(`[MeterForm] ❌ No meter_id, returning placeholder`);
                return <div>Save the meter first to manage elements</div>;
              }

              // For virtual meters, show CombinedMetersTab
              if (isVirtual) {
                console.log(`[MeterForm] ✅ Rendering CombinedMetersTab for virtual meter ${meterId}`);
                return (
                  <div className="meter-form__combined-meters-tab">
                    <CombinedMetersTab
                      meterId={meterId}
                      isVirtual={true}
                      isParentSaved={isParentSaved}
                      onParentSave={handleParentSave}
                      onError={(error) => console.error('CombinedMetersTab error:', error)}
                    />
                  </div>
                );
              }

              // For physical meters, show ElementsGrid
              console.log(`[MeterForm] ✅ Rendering ElementsGrid for physical meter ${meterId}`);
              return (
                <div className="meter-form__elements-grid">
                  <ElementsGrid
                    meterId={Number(meterId)}
                    onError={(error) => console.error('ElementsGrid error:', error)}
                    onSuccess={(message) => console.log('ElementsGrid success:', message)}
                  />
                </div>
              );
            }
            // Return null to let BaseForm render the default field
            return null;
          }}
        />
      </div>
    </FormContainer>
  );
};

export default MeterForm;
