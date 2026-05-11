
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
            field({ name: 'type', order: 2, type: FieldTypes.SELECT, default: 'cost', required: true, label: 'Report Type', dbField: 'type', 
              enumValues: ['cost', 'revenue'],
              enumLabels: {'cost': 'Cost', 'revenue': 'Revenue'},
              filterable: ['true'], showOn: ['list', 'form'], customField: true }),
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
          name: 'Report Settings',
          order: 3,
          minWidth: '100%',
          horizontal: true,
          fields: [
            field({ name: 'time_frame', order: 1, type: FieldTypes.SELECT, default: 'monthly', required: false, label: 'Time Frame', dbField: 'time_frame',
              enumValues: ['today', 'weekly', 'monthly', 'yearly', 'custom'],
              enumLabels: {'today': 'Today', 'weekly': 'This Week', 'monthly': 'This Month', 'yearly': 'This Year', 'custom': 'Custom Range' },
              showOn: ['form'] }),
            field({ name: 'visualization_type', order: 2, type: FieldTypes.SELECT, default: 'bar', required: false, label: 'Visualization', dbField: 'visualization_type',
              enumValues: ['bar', 'line', 'pie', 'csv'],
              enumLabels: { 'bar': 'Bar Chart', 'line': 'Line Chart', 'pie': 'Pie Chart', 'csv': 'CSV' },
              showOn: ['form'] }),
            field({ name: 'grouping_type', order: 3, type: FieldTypes.SELECT, default: 'daily', required: false, label: 'Grouping', dbField: 'grouping_type',
              enumValues: ['hourly', 'daily', 'weekly', 'monthly'],
              enumLabels: { 'hourly': 'Hourly', 'daily': 'Daily', 'weekly': 'Weekly', 'monthly': 'Monthly' },
              showOn: ['form'] }),
            field({ name: 'attach_as', order: 4, type: FieldTypes.SELECT, default: 'html', required: false, label: 'Attach As', dbField: 'attach_as',
              enumValues: ['html', 'pdf', 'csv'],
              enumLabels: { 'html': 'Embedded HTML', 'pdf': 'PDF', 'csv': 'CSV' },
              showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Meter Selections',
          order: 4,
          minWidth: '100%',
          fields: [
            field({ name: 'meter_selections', order: 1, type: FieldTypes.OBJECT, default: [], required: false, label: 'Meter Selections', dbField: 'meter_selections', showOn: ['form'], customField: true }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Schedule',
      order: 2,
      sections: [
        section({
          name: 'Schedule',
          order: 1,
          flex: 1,
          fields: [
            field({ name: 'cron', order: 1, type: FieldTypes.STRING, default: '0 9 * * *', required: true, label: 'Schedule', dbField: 'cron', showOn: ['form'], customField: true }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Email',
      order: 3,
      sections: [
        section({
          name: 'Email Settings',
          order: 1,
          fields: [
            field({ name: 'recipients', order: 1, type: FieldTypes.OBJECT, default: { from: null, to: [] }, required: true, label: 'Email', dbField: 'recipients', showOn: ['form'], customField: true }),
          ],
        }),
      ],
    }),
    tab({
      name: 'History',
      order: 4,
      sections: [
        section({ name: 'Execution History', order: 1, flex: 1, fields: [] }),
      ],
    }),
  ],
});
