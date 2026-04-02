
// ===== REPORT (from ReportWithSchema.js) =====
import { defineSchema, field, tab, section, FieldTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const reportSchema = defineSchema({
  entityName: 'Report',
  tableName: 'report',
  description: 'Scheduled report configuration for automated email delivery',
  formMaxWidth: '800px',
  idFieldName: 'report_id',

  formTabs: [
    tab({
      name: 'General',
      order: 1,
      sections: [
        section({
          name: 'Details',
          order: 1,
          flex: 1,
          fields: [
            field({ name: 'name', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Report Name', dbField: 'name', minLength: 1, maxLength: 255, placeholder: 'Monthly Usage Report', filterable: ['main'], showOn: ['list', 'form'] }),
            field({ name: 'type', order: 2, type: FieldTypes.SELECT, default: 'meter_readings', required: true, label: 'Report Type', dbField: 'type', enumValues: ['meter_readings', 'usage_summary', 'daily_summary'], enumLabels: { 'meter_readings': 'Meter Readings', 'usage_summary': 'Usage Summary', 'daily_summary': 'Daily Summary' }, filterable: ['true'], showOn: ['list', 'form'] }),
            field({ name: 'schedule', order: 3, type: 'custom', default: '0 9 * * *', required: true, label: 'Schedule', dbField: 'schedule', showOn: ['form'], customField: true, helpText: 'When this report should be sent' }),
          ],
        }),
        section({
          name: 'Status',
          order: 2,
          maxWidth: '150px',
          fields: [
            field({ name: 'active', order: 1, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', filterable: ['true'], showOn: ['list', 'form'] }),
          ],
        }),
        section({
          name: 'Meter Selections',
          order: 3,
          minWidth: '100%',
          fields: [
            field({ name: 'meter_selections', order: 1, type: FieldTypes.OBJECT, default: [], required: false, label: 'Meter Selections', dbField: 'meter_selections', showOn: ['form'], customField: true }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Recipients',
      order: 2,
      sections: [
        section({
          name: 'Recipients',
          order: 1,
          fields: [
            field({ name: 'recipients', order: 4, type: FieldTypes.STRING, default: [], required: true, label: 'Email Recipients', dbField: 'recipients', placeholder: 'user@example.com', helpText: 'Add email addresses to receive the report', showOn: ['form'], customField: true }),
          ],
        }),
      ],
    }),
    tab({
      name: 'History',
      order: 3,
      sections: [
        section({ name: 'Execution History', order: 1, flex: 1, fields: [] }),
      ],
    }),
  ],
});