import { defineSchema, field, tab, section, FieldTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const notificationSchema = defineSchema({
  entityName: 'Notification',
  tableName: 'notification',
  description: 'System notifications for meter health alerts',

  entityFields: {
    id: field({ name: 'id', type: FieldTypes.STRING, label: 'ID', dbField: 'notification_id', readOnly: true }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.STRING, label: 'Tenant', dbField: 'tenant_id', readOnly: true }),
    users_id: field({ name: 'users_id', type: FieldTypes.STRING, label: 'User', dbField: 'users_id', readOnly: true }),
    meter_id: field({ name: 'meter_id', type: FieldTypes.STRING, label: 'Meter ID', dbField: 'meter_id', readOnly: true }),
    meter_element_id: field({ name: 'meter_element_id', type: FieldTypes.STRING, label: 'Element ID', dbField: 'meter_element_id', readOnly: true }),
  },

  formTabs: [
    tab({
      name: 'Details',
      order: 1,
      sections: [
        section({
          name: 'Notification',
          order: 1,
          flex: 1,
          fields: [
            field({
              name: 'severity', order: 1, type: FieldTypes.SELECT, default: 'warning', required: false,
              label: 'Severity', dbField: 'severity', readOnly: true, filterable: ['main'], showOn: ['list'],
              enumValues: ['info', 'warning', 'error'],
              enumLabels: { info: 'Info', warning: 'Warning', error: 'Error' },
            }),
            field({
              name: 'notification_type', order: 2, type: FieldTypes.SELECT, default: 'stale', required: false,
              label: 'Type', dbField: 'notification_type', readOnly: true, filterable: ['main'], showOn: ['list'],
              enumValues: ['stale', 'all_zero', 'error_status'],
              enumLabels: { stale: 'No Readings', all_zero: 'Zero Readings', error_status: 'Error' },
            }),
            field({ name: 'title', order: 3, type: FieldTypes.STRING, default: '', required: false, label: 'Title', dbField: 'title', readOnly: true, showOn: ['list'] }),
            field({ name: 'description', order: 4, type: FieldTypes.STRING, default: '', required: false, label: 'Details', dbField: 'description', readOnly: true, showOn: ['list'] }),
            field({ name: 'created_at', order: 5, type: FieldTypes.DATE, default: null, required: false, label: 'Time', dbField: 'created_at', readOnly: true, showOn: ['list'] }),
          ],
        }),
      ],
    }),
  ],
});
