import { defineSchema, field, tab, section, FieldTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const notificationSettingsSchema = defineSchema({
  entityName: 'NotificationSettings',
  tableName: 'notification_settings',
  description: 'Configuration for automated meter health checks and notifications',
  formMaxWidth: '600px',

  entityFields: {
    id: field({ name: 'id', type: FieldTypes.STRING, label: 'ID', dbField: 'notification_settings_id', readOnly: true }),
    updated_at: field({ name: 'updated_at', type: FieldTypes.DATE, label: 'Last Updated', dbField: 'updated_at', readOnly: true }),
  },

  formTabs: [
    tab({
      name: 'Settings',
      order: 1,
      sections: [
        section({
          name: 'Health Check',
          order: 1,
          flex: 1,
          fields: [
            field({
              name: 'enabled', order: 1, type: FieldTypes.BOOLEAN, default: true, required: false,
              label: 'Enable automatic health checks', dbField: 'enabled', showOn: ['form'],
            }),
            field({
              name: 'health_check_cron', order: 2, type: FieldTypes.STRING, default: '0 * * * *', required: false,
              label: 'Health Check Schedule (cron)', dbField: 'health_check_cron', showOn: ['form'],
              description: 'Cron expression controlling how often meters are checked. Default: "0 * * * *" (every hour)',
            }),
            field({
              name: 'stale_threshold_hours', order: 3, type: FieldTypes.NUMBER, default: 2, required: false,
              label: 'Stale Threshold (hours)', dbField: 'stale_threshold_hours', min: 1, max: 168, showOn: ['form'],
              description: 'A meter is flagged as stale when no reading has been received within this many hours.',
            }),
            field({
              name: 'daily_email_cron', order: 4, type: FieldTypes.STRING, default: '0 9 * * *', required: false,
              label: 'Daily Email Summary Schedule (cron)', dbField: 'daily_email_cron', showOn: ['form'],
              description: 'Cron expression for the daily email summary. Default: "0 9 * * *" (9 am daily)',
            }),
          ],
        }),
      ],
    }),
  ],
});
