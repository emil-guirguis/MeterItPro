
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
            name: 'schedule', order: 1, type: FieldTypes.SELECT, default: '0 9 * * *', required: true, label: 'Schedule', dbField: 'schedule', showOn: ['form'],
            enumValues: ['0 9 * * *', '0 6 * * *', '0 12 * * *', '0 17 * * *', '0 0 * * *', '0 9 * * 1', '0 9 * * 3', '0 9 * * 5', '0 9 1 * *', '0 9 15 * *'],
            enumLabels: {
              '0 9 * * *':  'Daily at 9 AM',
              '0 6 * * *':  'Daily at 6 AM',
              '0 12 * * *': 'Daily at Noon',
              '0 17 * * *': 'Daily at 5 PM',
              '0 0 * * *':  'Daily at Midnight',
            '0 9 * * 1':  'Weekly — Monday at 9 AM',
              '0 9 * * 3':  'Weekly — Wednesday at 9 AM',
              '0 9 * * 5':  'Weekly — Friday at 9 AM',
              '0 9 1 * *':  'Monthly — 1st at 9 AM',
              '0 9 15 * *': 'Monthly — 15th at 9 AM',
            },
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
          field({ name: 'register_ids', order: 1, type: 'custom', label: 'Registers', required: false, default: [], showOn: ['form'], customField: true }),
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