// ===== TENANT (from TenantWithSchema.js) =====
import { defineSchema, field, tab, section, FieldTypes, relationship, RelationshipTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const tenantSchema = defineSchema({
  entityName: 'Tenant',
  tableName: 'tenant',
  description: 'Tenant entity for multi-tenant isolation',

  customListColumns: {},

  formFields: {
    name: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 100, placeholder: 'Company Name' }),
    timezone: field({ type: FieldTypes.TIMEZONE, default: '', required: false, label: 'Timezone', dbField: 'timezone', description: 'IANA timezone for this tenant' }),
    currency: field({ type: FieldTypes.CURRENCY, default: 'USD', required: false, label: 'Currency', dbField: 'currency', description: 'Default currency for this tenant' }),
    language: field({ type: FieldTypes.LANGUAGE, default: 'en', required: false, label: 'Language', dbField: 'language', description: 'Default language for this tenant' }),
    dateFormat: field({ type: FieldTypes.STRING, default: 'MM/DD/YYYY', required: false, label: 'Date Format', dbField: 'date_format', placeholder: 'MM/DD/YYYY' }),
    timeFormat: field({ type: FieldTypes.SELECT, default: '12h', required: false, label: 'Time Format', dbField: 'time_format', enumValues: ['12h', '24h'], enumLabels: { '12h': '12-hour', '24h': '24-hour' } }),
    defaultPageSize: field({ type: FieldTypes.NUMBER, default: 20, required: false, label: 'Default Page Size', dbField: 'default_page_size', description: 'Rows per page in list views' }),
    url: field({ type: FieldTypes.URL, default: '', required: false, label: 'Website URL', dbField: 'url', maxLength: 255, placeholder: 'https://example.com' }),
    contactEmail: field({ type: FieldTypes.EMAIL, default: '', required: false, label: 'Contact Email', dbField: 'contact_email', maxLength: 255, placeholder: 'contact@example.com' }),
    street: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Street Address', dbField: 'street', maxLength: 100, placeholder: '123 Main St' }),
    street2: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Street Address 2', dbField: 'street2', maxLength: 100, placeholder: 'Suite 100' }),
    city: field({ type: FieldTypes.STRING, default: '', required: false, label: 'City', dbField: 'city', maxLength: 50, placeholder: 'New York' }),
    state: field({ type: FieldTypes.STRING, default: '', required: false, label: 'State', dbField: 'state', maxLength: 50, placeholder: 'NY' }),
    zip: field({ type: FieldTypes.STRING, default: '', required: false, label: 'ZIP Code', dbField: 'zip', maxLength: 15, placeholder: '10001' }),
    country: field({ type: FieldTypes.COUNTRY, default: 'US', required: false, label: 'Country', dbField: 'country', maxLength: 50, placeholder: 'USA' }),
    active: field({ type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', description: 'Whether the tenant is active' }),
    meterReadingBatchCount: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Meter Reading Batch Count', dbField: 'meter_reading_batch_count', description: 'Number of meter reading batches processed' }),
  },

  entityFields: {
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'tenant_id' }),
    createdAt: field({ type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
    updatedAt: field({ type: FieldTypes.DATE, default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
  },

  relationships: {
    users: relationship({ type: RelationshipTypes.HAS_MANY, model: 'User', foreignKey: 'tenant_id', autoLoad: false, as: 'users' }),
    contacts: relationship({ type: RelationshipTypes.HAS_MANY, model: 'Contact', foreignKey: 'contact_id', autoLoad: false, as: 'contacts' }),
    devices: relationship({ type: RelationshipTypes.HAS_MANY, model: 'Device', foreignKey: 'device_id', autoLoad: false, as: 'devices' }),
  },

  validation: {},
});
