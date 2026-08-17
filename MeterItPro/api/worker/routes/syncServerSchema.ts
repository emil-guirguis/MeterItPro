import { defineSchema, field, tab, section, FieldTypes } from '@meterit/framework-backend/api/base/SchemaDefinition';

export const syncServerSchema = defineSchema({
  entityName: 'SyncServer',
  tableName: 'sync_server',
  description: 'Sync server entity',
  idFieldName: 'sync_server_id',
  formMaxWidth: '700px',
  customListColumns: {},

  formTabs: [
    tab({
      name: 'General',
      order: 1,
      sections: [
        section({
          name: 'Details',
          order: 1,
          fields: [
            field({ name: 'name', order: 2, type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 200, placeholder: 'e.g. Office Building', showOn: ['list', 'form'] }),
            field({ name: 'location_id', order: 1, type: FieldTypes.NUMBER, default: null, required: false, label: 'Location', dbField: 'location_id', showOn: ['form'], validate: true, validationFields: ['name'] }),
            field({ name: 'timezone', order: 3, type: FieldTypes.TIMEZONE, default: 'UTC', required: false, label: 'Timezone', dbField: 'timezone', showOn: ['list', 'form'] }),
          ],
        }),
        section({
          name: 'Status',
          order: 2,
          maxWidth: '100px',
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            field({ name: 'active', order: 1, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', showOn: ['list', 'form'] }),
          ],
        }),
        section({
          name: 'Provision',
          order: 3,
          minWidth: '100%',
          fields: [
            field({ name: 'provision_status', order: 1, type: FieldTypes.STRING, default: 'pending', required: false, label: 'Tunnel Status', dbField: 'provision_status', readOnly: true, showOn: ['list', 'form'], enumValues: ['pending', 'provisioning', 'active', 'error'] }),
            field({ name: 'tunnel_url', order: 2, type: FieldTypes.URL, default: '', required: false, label: 'Tunnel URL', dbField: 'tunnel_url', readOnly: true, showOn: ['form'] }),
            field({ name: 'provision_error', order: 3, type: FieldTypes.STRING, default: '', required: false, label: 'Provision Error', dbField: 'provision_error', readOnly: true, showOn: ['form'] }),
            field({ name: 'bootstrap_key', order: 4, type: FieldTypes.STRING, default: '', required: false, label: 'Bootstrap Key', dbField: 'bootstrap_key', readOnly: true, showOn: ['form'], description: 'Add to sync server .env as SYNC_SERVER_BOOTSTRAP_KEY' }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Audit',
      order: 2,
      sections: [
        section({
          name: '',
          order: 1,
          fields: [
            field({ name: 'notes', order: 1, type: FieldTypes.STRING, default: '', required: false, label: 'Notes', dbField: 'notes', showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Audit',
          order: 2,
          fields: [
            field({ name: 'created_at', order: 1, type: FieldTypes.DATETIME, default: null, disable: true, label: 'Created At', dbField: 'created_at', showOn: ['form'] }),
            field({ name: 'updated_at', order: 2, type: FieldTypes.DATETIME, default: null, disable: true, label: 'Updated At', dbField: 'updated_at', showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    sync_server_id: field({ name: 'sync_server_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'sync_server_id' }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
    tunnel_id: field({ name: 'tunnel_id', type: FieldTypes.STRING, default: null, readOnly: true, label: 'Tunnel ID', dbField: 'tunnel_id' }),
    dns_record_id: field({ name: 'dns_record_id', type: FieldTypes.STRING, default: null, readOnly: true, label: 'DNS Record ID', dbField: 'dns_record_id' }),
    tunnel_url: field({ name: 'tunnel_url', type: FieldTypes.URL, default: '', readOnly: true, label: 'Tunnel URL', dbField: 'tunnel_url' }),
  },

  validation: {},

  deleteRestrictions: [
    { table: 'meter', fk: 'sync_server_id', label: 'meter' },
  ],
});
