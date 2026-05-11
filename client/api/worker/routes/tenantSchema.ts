// ===== TENANT =====
import { defineSchema, field, tab, section, FieldTypes, relationship, RelationshipTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const tenantSchema = defineSchema({
  entityName: 'Tenant',
  tableName: 'tenant',
  description: 'Tenant entity for multi-tenant isolation',
  idFieldName: 'tenant_id',
  maxWidth: '800px',
  customListColumns: {},

  formTabs: [
    tab({
      name: 'General',
      order: 1,
      sections: [
        section({
          name: 'Basic Info',
          order: 1,
          flex: 1,
          fields: [
            field({ name: 'name',         order: 1, type: FieldTypes.STRING,  default: '',   required: true,  label: 'Company Name',   dbField: 'name',          maxLength: 100, placeholder: 'Company Name',          showOn: ['list', 'form'] }),
            field({ name: 'contactEmail', order: 2, type: FieldTypes.EMAIL,   default: '',   required: false, label: 'Contact Email',  dbField: 'contact_email', maxLength: 255, placeholder: 'contact@example.com',   showOn: ['list', 'form'] }),
            field({ name: 'url',          order: 3, type: FieldTypes.URL,     default: '',   required: false, label: 'Website URL',    dbField: 'url',           maxLength: 255, placeholder: 'https://example.com',   showOn: ['list', 'form'] }),
          ],
        }),
        section({
          name: 'Status',
          order: 2,
          maxWidth: '120px',
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            field({ name: 'active', order: 1, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', showOn: ['list', 'form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Address',
      order: 2,
      sections: [
        section({
          name: 'Address',
          order: 1,
          fields: [
            field({ name: 'street',  order: 1, type: FieldTypes.STRING,  default: '', required: false, label: 'Street Address',   dbField: 'street',  maxLength: 100, placeholder: '123 Main St', showOn: ['form'] }),
            field({ name: 'street2', order: 2, type: FieldTypes.STRING,  default: '', required: false, label: 'Street Address 2', dbField: 'street2', maxLength: 100, placeholder: 'Suite 100',   showOn: ['form'] }),
            field({ name: 'city',    order: 3, type: FieldTypes.STRING,  default: '', required: false, label: 'City',             dbField: 'city',    maxLength: 50,  placeholder: 'New York',    showOn: ['form'] }),
            field({ name: 'state',   order: 4, type: FieldTypes.STRING,  default: '', required: false, label: 'State',            dbField: 'state',   maxLength: 50,  placeholder: 'NY',          showOn: ['form'] }),
            field({ name: 'zip',     order: 5, type: FieldTypes.STRING,  default: '', required: false, label: 'ZIP Code',         dbField: 'zip',     maxLength: 15,  placeholder: '10001',       showOn: ['form'] }),
            field({ name: 'country', order: 6, type: FieldTypes.COUNTRY, default: 'US', required: false, label: 'Country',        dbField: 'country', maxLength: 50,                              showOn: ['form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Settings',
      order: 3,
      sections: [
        section({
          name: 'Localization',
          order: 1,
          fields: [
            field({ name: 'timezone',               order: 1, type: FieldTypes.TIMEZONE, default: '',           required: false, label: 'Timezone',                 dbField: 'timezone',                description: 'IANA timezone', showOn: ['form'] }),
            field({ name: 'currency',               order: 2, type: FieldTypes.CURRENCY, default: 'USD',        required: false, label: 'Currency',                 dbField: 'currency',                showOn: ['form'] }),
            field({ name: 'language',               order: 3, type: FieldTypes.LANGUAGE, default: 'en',         required: false, label: 'Language',                 dbField: 'language',                showOn: ['form'] }),
            field({ name: 'dateFormat',             order: 4, type: FieldTypes.STRING,   default: 'MM/DD/YYYY', required: false, label: 'Date Format',              dbField: 'date_format',             placeholder: 'MM/DD/YYYY', showOn: ['form'] }),
            field({ name: 'timeFormat',             order: 5, type: FieldTypes.SELECT,   default: '12h',        required: false, label: 'Time Format',              dbField: 'time_format',             enumValues: ['12h', '24h'], enumLabels: { '12h': '12-hour', '24h': '24-hour' }, showOn: ['form'] }),
            field({ name: 'defaultPageSize',        order: 6, type: FieldTypes.NUMBER,   default: 20,           required: false, label: 'Default Page Size',        dbField: 'default_page_size',       description: 'Rows per page', showOn: ['form'] }),
            field({ name: 'meterReadingBatchCount', order: 7, type: FieldTypes.NUMBER,   default: 0,            required: false, label: 'Meter Reading Batch Count', dbField: 'meter_reading_batch_count', showOn: ['form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Equipment',
      order: 4,
      sections: [
        section({ name: '', order: 1, fields: [] }),
      ],
    }),
    tab({
      name: 'Costs',
      order: 5,
      sections: [
        section({ name: '', order: 1, fields: [] }),
      ],
    }),
    tab({
      name: 'Documents',
      order: 6,
      sections: [
        section({ name: '', order: 1, fields: [] }),
      ],
    }),
  ],

  entityFields: {
    tenant_id:  field({ name: 'tenant_id',  type: FieldTypes.NUMBER,   default: null, readOnly: true, label: 'ID',         dbField: 'tenant_id' }),
    createdAt:  field({ name: 'created_at', type: FieldTypes.DATETIME, default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
    updatedAt:  field({ name: 'updated_at', type: FieldTypes.DATETIME, default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
  },

  relationships: {
    users:    relationship({ type: RelationshipTypes.HAS_MANY, model: 'User',    foreignKey: 'tenant_id',  autoLoad: false, as: 'users' }),
    contacts: relationship({ type: RelationshipTypes.HAS_MANY, model: 'Contact', foreignKey: 'contact_id', autoLoad: false, as: 'contacts' }),
    devices:  relationship({ type: RelationshipTypes.HAS_MANY, model: 'Device',  foreignKey: 'device_id',  autoLoad: false, as: 'devices' }),
  },

  validation: {},
});
