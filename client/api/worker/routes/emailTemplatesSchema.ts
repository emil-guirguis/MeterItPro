// ===== EMAIL TEMPLATES (from EmailTemplatesWithSchema.js - commented out in source) =====
import { defineSchema, field, tab, section, FieldTypes } from '@meterit/framework-backend/api/base/SchemaDefinition';

export const emailTemplatesSchema = defineSchema({
  entityName: 'EmailTemplates',
  tableName: 'email_templates',
  description: 'EmailTemplates entity',

  customListColumns: {},

  formFields: {
    name: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 255 }),
    subject: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Subject', dbField: 'subject', maxLength: 500 }),
    content: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Content', dbField: 'content' }),
    category: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Category', dbField: 'category', maxLength: 50 }),
    variables: field({ type: FieldTypes.OBJECT, default: null, required: false, label: 'Variables', dbField: 'variables' }),
    isdefault: field({ type: FieldTypes.BOOLEAN, default: false, required: false, label: 'Is Default', dbField: 'isdefault' }),
    isactive: field({ type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Is Active', dbField: 'isactive' }),
    usagecount: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Usage Count', dbField: 'usagecount' }),
    lastused: field({ type: FieldTypes.DATETIME, default: '', required: false, label: 'Last Used', dbField: 'lastused' }),
    createdby: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Created By', dbField: 'createdby' }),
  },

  entityFields: {
    id: field({ name: 'email_templates_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Id', dbField: 'email_templates_id' }),
    createdat: field({ type: FieldTypes.DATETIME, default: null, readOnly: true, label: 'Created At', dbField: 'createdat' }),
    updatedat: field({ type: FieldTypes.DATETIME, default: null, readOnly: true, label: 'Updated At', dbField: 'updatedat' }),
    tenantId: field({ type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Tenant ID', dbField: 'tenant_id' }),
  },

  validation: {},

  deleteRestrictions: [
    { table: 'email_logs', fk: 'template_id', label: 'email log' },
    { table: 'notification_logs', fk: 'template_id', label: 'notification log' },
  ],
});
