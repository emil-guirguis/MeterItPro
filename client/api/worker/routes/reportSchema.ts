
// ===== REPORT (from ReportWithSchema.js) =====
import { defineSchema, field, tab, section, FieldTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const reportSchema = defineSchema({
  entityName: 'Report',
  tableName: 'report',
  description: 'Scheduled report configuration for automated email delivery',
  formMaxWidth: '600px',

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
          ],
        }),
        section({
          name: 'Status',
          order: 2,
          maxWidth : '150px',
          fields: [
            field({ name: 'active', order: 1, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', filterable: ['true'], showOn: ['list', 'form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Schedule',
      order: 2,
      sections: [
        section({ name: 'Execution Schedule', order: 1, flex: 1, fields: [
          field({
            name: 'schedule', order: 1, type: 'custom', default: '0 9 * * *', required: true, label: 'Schedule', dbField: 'schedule', showOn: ['form'], customField: true,
            helpText: 'When this report should be sent',
          }),
        ] }),
      ],
    }),
    tab({
      name: 'Recipients',
      order: 3,
      sections: [
        section({ name: 'Email Recipients', order: 1, flex: 1, fields: [
          field({ name: 'recipients', order: 1, type: FieldTypes.STRING, default: [], required: true, label: 'Email Recipients', dbField: 'recipients', placeholder: 'user@example.com', helpText: 'Add email addresses to receive the report', showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Meter Selections',
      order: 4,
      sections: [
        section({ name: 'Meters, Elements & Registers', order: 1, flex: 1, fields: [
          field({ name: 'meter_selections', order: 1, type: FieldTypes.OBJECT, default: [], required: false, label: 'Meter Selections', dbField: 'meter_selections', showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Meters & Elements',
      order: 5,
      sections: [
        section({ name: 'Select Meters and Elements', order: 1, flex: 1, fields: [
          field({ name: 'meter_ids', order: 1, type: 'custom', label: 'Meters and Elements', required: false, default: [], showOn: ['form'], customField: true }),
          field({ name: 'element_ids', order: 2, type: 'custom', label: 'Selected Elements', required: false, default: [], showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Registers',
      order: 6,
      sections: [
        section({ name: 'Select Registers', order: 1, flex: 1, fields: [
          field({ name: 'register_ids', order: 1, type: FieldTypes.OBJECT, label: 'Registers', required: false, default: [], showOn: ['form'], dbField: 'register_ids', description: 'Selected register field names' }),
        ] }),
      ],
    }),
    tab({
      name: 'Formatting',
      order: 7,
      sections: [
        section({ name: 'Output Format', order: 1, flex: 1, fields: [
          field({ name: 'html_format', order: 1, type: FieldTypes.BOOLEAN, label: 'Enable HTML Formatting', required: false, default: false, showOn: ['form'] }),
        ] }),
      ],
    }),
  ],
});