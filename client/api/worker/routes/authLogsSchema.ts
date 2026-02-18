// ===== AUTH LOGS (from AuthLogsWithSchema.js) =====
import { defineSchema, field, tab, section, FieldTypes, relationship, RelationshipTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const authLogsSchema = defineSchema({
  entityName: 'AuthLogs',
  tableName: 'auth_logs',
  description: 'Authentication logs entity for tracking login and auth events',

  customListColumns: {},

  formFields: {
    userId: field({ type: FieldTypes.NUMBER, default: 0, required: true, label: 'User ID', dbField: 'user_id' }),
    eventType: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Event Type', dbField: 'event_type', maxLength: 50 }),
    status: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Status', dbField: 'status', maxLength: 20 }),
    ipAddress: field({ type: FieldTypes.STRING, default: '', required: false, label: 'IP Address', dbField: 'ip_address' }),
    userAgent: field({ type: FieldTypes.STRING, default: '', required: false, label: 'User Agent', dbField: 'user_agent' }),
    details: field({ type: FieldTypes.JSON, default: {}, required: false, label: 'Details', dbField: 'details' }),
  },

  entityFields: {
    authLogsId: field({ name: 'auth_logs_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Auth Logs ID', dbField: 'auth_logs_id' }),
    createdAt: field({ type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
  },

  relationships: {
    user: relationship({ type: RelationshipTypes.BELONGS_TO, model: 'User', foreignKey: 'user_id', autoLoad: false }),
  },

  validation: {},
});
