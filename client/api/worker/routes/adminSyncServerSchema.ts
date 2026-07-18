import { defineSchema, field, tab, section, FieldTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const adminSyncServerSchema = defineSchema({
  entityName: 'AdminSyncServer',
  tableName: 'sync_server',
  description: 'Cross-tenant sync server admin view',
  idFieldName: 'sync_server_id',
  formMaxWidth: '640px',
  customListColumns: {},

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
            field({ name: 'tenant_name', order: 0, type: FieldTypes.STRING,  default: '',   readOnly: true,  label: 'Tenant',  dbField: 'tenant_name', showOn: ['list'] }),
            field({ name: 'tenant_id',  order: 1, type: FieldTypes.NUMBER,   default: null, required: true,  label: 'Tenant',   dbField: 'tenant_id',  showOn: ['form'] }),
            field({ name: 'name',       order: 2, type: FieldTypes.STRING,   default: '',   required: false, readOnly: true, label: 'Name', dbField: 'name', maxLength: 255, placeholder: 'Auto-generated on save (sync-xxxxxx)', filterable: ['main'], showOn: ['list', 'form'] }),
            field({ name: 'timezone',   order: 3, type: FieldTypes.TIMEZONE, default: 'UTC', required: false, label: 'Timezone', dbField: 'timezone',   showOn: ['form'] }),
            field({ name: 'notes',      order: 4, type: FieldTypes.STRING,   default: '',   required: false, label: 'Notes',    dbField: 'notes',      maxLength: 2000, showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Status',
          order: 2,
          maxWidth: '160px',
          fields: [
            field({ name: 'active', order: 1, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', showOn: ['form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Provisioning',
      order: 2,
      sections: [
        section({
          name: 'Credentials',
          order: 1,
          description: 'Enter these on the sync server during install',
          fields: [
            field({ name: 'sync_server_id',  order: 1, type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Sync Server ID', dbField: 'sync_server_id', showOn: ['form'] }),
            field({ name: 'bootstrap_key',   order: 2, type: FieldTypes.STRING, default: '',   readOnly: true, label: 'Bootstrap Key',  dbField: 'bootstrap_key',  showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Tunnel',
          order: 2,
          fields: [
            field({ name: 'provision_status', order: 1, type: FieldTypes.STRING, default: 'pending', readOnly: true, label: 'Provision Status', dbField: 'provision_status', showOn: ['list', 'form'], enumValues: ['pending', 'provisioning', 'active', 'error'] }),
            field({ name: 'tunnel_url',       order: 2, type: FieldTypes.URL,    default: '',        readOnly: true, label: 'Tunnel URL',       dbField: 'tunnel_url',       showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    sync_server_id: field({ name: 'sync_server_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'sync_server_id' }),
  },

  validation: {},

  deleteRestrictions: [
    { table: 'meter', fk: 'sync_server_id', label: 'meter' },
  ],
});
