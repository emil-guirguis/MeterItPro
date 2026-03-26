import React from 'react';
import { BaseForm, FormContainer } from '@framework/components/form';
import { CronField } from '@framework/components/formfield/CronField';
import { DeviceRegisterChecklist } from '../../components/shared/DeviceRegisterChecklist';
import { useReportsEnhanced } from './reportsStore';
import { RecipientsField, MeterElementSelector, RegisterSelector } from './components';
import type { Report } from './types';
import './ReportForm.css';

interface ReportFormProps {
  report?: Report;
  onSubmit: (data: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * ReportForm Component
 * 
 * Refactored to use BaseForm with schema-driven rendering.
 * Removes manual state management and validation logic.
 * Uses custom field renderers for recipients, schedule, meter/element, and register fields.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5**
 */
export const ReportForm: React.FC<ReportFormProps> = ({
  report,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const reports = useReportsEnhanced();

  return (
    <FormContainer>
      <div className="form-container__content">
        <BaseForm
          schemaName="report"
          entity={report}
          store={reports}
          onCancel={onCancel}
          onLegacySubmit={onSubmit}
          loading={loading}
          showTabs={true}
          renderCustomField={(fieldName, fieldDef, value, error, isDisabled, onChange) => {
            // Custom rendering for schedule field
            if (fieldName === 'schedule') {
              return (
                <CronField
                  name="schedule"
                  label={fieldDef?.label}
                  value={value ?? '0 9 * * *'}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isDisabled}
                  error={error}
                  touched={!!error}
                  help={fieldDef?.helpText}
                  required={fieldDef?.required}
                />
              );
            }

            // Custom rendering for recipients field
            if (fieldName === 'recipients') {
              return (
                <RecipientsField
                  value={value || []}
                  error={error}
                  isDisabled={isDisabled}
                  onChange={onChange}
                />
              );
            }

            // Custom rendering for meter_ids and element_ids fields
            if (fieldName === 'meter_ids' || fieldName === 'element_ids') {
              return (
                <MeterElementSelector
                  value={{
                    meter_ids: report?.meter_ids || [],
                    element_ids: report?.element_ids || [],
                  }}
                  error={error}
                  isDisabled={isDisabled}
                  onChange={(newValue) => {
                    // Update both fields when either changes
                    onChange(newValue);
                  }}
                />
              );
            }

            // Custom rendering for register_ids field (stores field_names as JSONB array)
            if (fieldName === 'register_ids') {
              // Get the first meter_id from the report as the device context
              const deviceId = report?.meter_ids?.[0] ? parseInt(report.meter_ids[0]) : null;

              return (
                <DeviceRegisterChecklist
                  deviceId={deviceId}
                  value={Array.isArray(value) ? value : []}
                  onChange={onChange}
                  label="Registers"
                />
              );
            }

            // HTML format checkbox - let BaseForm render default
            if (fieldName === 'html_format') {
              return null; // BaseForm will render as checkbox
            }

            // Return null to let BaseForm render default field
            return null;
          }}
        />
      </div>
    </FormContainer>
  );
};

export default ReportForm;
