/**
 * Schema routes - Hono worker
 * Returns complete schema objects matching the Node.js API format.
 * Ported from the Node.js *WithSchema.js model files.
 */

import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables, authenticateToken } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Protect all schema routes with authentication
app.use('*', authenticateToken);

// ---------------------------------------------------------------------------
// Helper: create a field definition matching SchemaDefinition.field()
// ---------------------------------------------------------------------------
function field(def: Record<string, any>) {
  return {
    name: def.name ?? null,
    type: def.type,
    default: def.default,
    required: def.required ?? false,
    readOnly: def.readOnly ?? false,
    disable: def.disable ?? false,
    label: def.label ?? '',
    description: def.description ?? '',
    placeholder: def.placeholder ?? '',
    dbField: def.dbField ?? null,
    enumValues: def.enumValues ?? null,
    enumLabels: def.enumLabels ?? null,
    minLength: def.minLength ?? null,
    maxLength: def.maxLength ?? null,
    min: def.min ?? null,
    max: def.max ?? null,
    pattern: def.pattern ?? null,
    showOn: def.showOn ?? null,
    formGrouping: def.formGrouping ?? null,
    validate: def.validate ?? null,
    validationFields: def.validationFields ?? null,
    order: def.order ?? null,
    minWidth: def.minWidth ?? null,
    maxWidth: def.maxWidth ?? null,
    filertable: def.filertable ?? null,
    filterable: def.filterable ?? null,
    visibleFor: def.visibleFor ?? null,
    customField: def.customField ?? null,
    helpText: def.helpText ?? null,
  };
}

// ---------------------------------------------------------------------------
// Enumerations (from constants/enumerations.js)
// ---------------------------------------------------------------------------
const DEVICE_MANUFACTURERS = [
  'DENT Instruments',
  'Honeywell',
  'Siemens',
  'TBWC, Inc.',
];

const DEVICE_TYPES = ['Electric', 'Gas', 'Water', 'Steam', 'Other'];

// ---------------------------------------------------------------------------
// Helper: extract formFields from formTabs (matches defineSchema logic)
// ---------------------------------------------------------------------------
function extractFormFieldsFromTabs(formTabs: any[]): Record<string, any> {
  const extracted: Record<string, any> = {};
  for (const tab of formTabs) {
    if (tab.sections && Array.isArray(tab.sections)) {
      for (const section of tab.sections) {
        if (section.fields && Array.isArray(section.fields)) {
          for (const f of section.fields) {
            if (f.type && f.name) {
              extracted[f.name] = f;
            }
          }
        }
      }
    }
  }
  return extracted;
}

// ---------------------------------------------------------------------------
// Helper: build a complete schema object matching toJSON() output
// ---------------------------------------------------------------------------
function buildSchema(def: {
  entityName: string;
  tableName: string;
  description?: string;
  formMaxWidth?: string;
  customListColumns?: Record<string, any>;
  formTabs?: any[];
  formFields?: Record<string, any>;
  entityFields?: Record<string, any>;
  relationships?: Record<string, any>;
  validation?: Record<string, any>;
}) {
  let formFields = def.formFields || {};

  if (def.formTabs && Array.isArray(def.formTabs)) {
    const extracted = extractFormFieldsFromTabs(def.formTabs);
    formFields = { ...extracted, ...formFields };
  }

  return {
    entityName: def.entityName,
    tableName: def.tableName,
    description: def.description || '',
    formFields,
    formTabs: def.formTabs || null,
    formMaxWidth: def.formMaxWidth || null,
    entityFields: def.entityFields || {},
    relationships: def.relationships || {},
    validation: {},
    version: '1.2.0',
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// SCHEMA DEFINITIONS (ported from Node.js *WithSchema.js files)
// ============================================================================

const schemas: Record<string, any> = {
  // -------------------------------------------------------------------------
  // METER
  // -------------------------------------------------------------------------
  meter: buildSchema({
    entityName: 'Meter',
    tableName: 'meter',
    description: 'Meter entity for managing electric, gas, water, and other utility meters',
    formMaxWidth: '770px',
    customListColumns: {},
    formTabs: [
      {
        name: 'Meter',
        order: 1,
        sections: [
          {
            name: 'Information',
            order: 1,
            minWidth: '350px',
            fields: [
              field({ name: 'name', order: 1, type: 'string', default: '', required: true, label: 'Meter Name', dbField: 'name', minLength: 3, maxLength: 100, placeholder: 'Enter meter name', showOn: ['list', 'form'], filertable: ['main'] }),
              field({ name: 'serial_number', order: 2, type: 'string', default: '', required: true, label: 'Serial Number', dbField: 'serial_number', maxLength: 200, placeholder: 'Enter serial number', filertable: ['true'], showOn: ['list', 'form'], visibleFor: ['physical'] }),
              field({ name: 'device_id', order: 3, type: 'number', default: null, required: true, label: 'Device', dbField: 'device_id', min: 1, maxLength: 200, showOn: ['form'], validate: true, validationFields: ['manufacturer', 'model_number'], visibleFor: ['physical'] }),
              field({ name: 'location_id', order: 4, type: 'number', default: null, required: true, label: 'Location', dbField: 'location_id', min: 1, showOn: ['form'], validate: true, validationFields: ['name'] }),
              field({ name: 'type', order: 5, type: 'select', default: 'electric', required: true, label: 'Meter Type', dbField: 'type', readOnly: false, enumValues: ['electric', 'gas', 'water', 'steam', 'other'], enumLabels: { electric: 'Electric', gas: 'Gas', water: 'Water', steam: 'Steam', other: 'Other' }, showOn: ['form', 'list'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
          {
            name: 'Network',
            order: 2,
            visibleFor: ['physical'],
            fields: [
              field({ name: 'ip', order: 1, type: 'string', default: '', required: true, label: 'IP Address', dbField: 'ip', placeholder: '192.168.1.100', showOn: ['list', 'form'] }),
              field({ name: 'port', order: 2, type: 'number', default: 47808, required: true, label: 'Port Number', dbField: 'port', min: 1, max: 65535, placeholder: '47808', showOn: ['form'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
          {
            name: 'Status',
            order: 3,
            fields: [
              field({ name: 'active', order: 1, type: 'boolean', default: true, required: true, label: 'Active', dbField: 'active', showOn: ['list', 'form'], filertable: ['true'] }),
              field({ name: 'installation_date', order: 2, type: 'date', default: null, required: false, label: 'Installation Date', dbField: 'installation_date', placeholder: 'Select date', showOn: ['form'] }),
              field({ name: 'is_virtual', order: 3, type: 'select', default: 'physical', required: true, label: 'Physical/Virtual', dbField: 'is_virtual', readOnly: true, enumValues: ['physical', 'virtual'], enumLabels: { physical: 'Physical', virtual: 'Virtual' }, showOn: ['form', 'list'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
      {
        name: 'Elements',
        order: 2,
        visibleFor: ['physical'],
        sections: [
          {
            name: 'Meter Elements',
            order: 1,
            fields: [
              field({ name: 'elements', order: 1, type: 'object', default: null, required: false, label: 'Elements', dbField: null, showOn: ['form'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
        ],
        sectionOrientation: null,
      },
      {
        name: 'Combined Meters',
        order: 2,
        visibleFor: ['virtual'],
        sections: [
          {
            name: 'Combined Meters',
            order: 1,
            fields: [
              field({ name: 'elements', order: 1, type: 'object', default: null, required: false, label: 'Elements', dbField: null, showOn: ['form'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
        ],
        sectionOrientation: null,
      },
      {
        name: 'Additional Info',
        order: 3,
        sectionOrientation: 'vertical',
        sections: [
          {
            name: 'notes',
            order: 1,
            minWidth: '500px',
            fields: [
              field({ name: 'notes', order: 1, type: 'string', default: '', required: false, label: 'Notes', dbField: 'notes', maxLength: 500, placeholder: 'Enter notes', showOn: ['form'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
          {
            name: 'Audit',
            order: 2,
            fields: [
              field({ name: 'created_at', order: 1, type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
              field({ name: 'updated_at', order: 2, type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
        ],
        visibleFor: null,
      },
    ],
    formFields: {
      elements: field({ type: 'object', default: null, required: false, label: 'Elements', dbField: null, showOn: ['form'] }),
      device: field({ type: 'string', default: '', readOnly: true, label: 'Device', dbField: null, showOn: ['list'] }),
    },
    entityFields: {
      meter_id: field({ name: 'meter_id', type: 'number', default: null, readOnly: true, label: 'ID', dbField: 'meter_id' }),
      tenant_id: field({ name: 'tenant_id', type: 'number', default: 0, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
    },
    relationships: {
      device: { type: 'belongsTo', model: 'Device', foreignKey: 'device_id', targetKey: 'device_id', through: null, autoLoad: false, select: null, as: null },
      location: { type: 'belongsTo', model: 'Location', foreignKey: 'location_id', targetKey: 'location_id', through: null, autoLoad: false, select: null, as: null },
    },
  }),

  // -------------------------------------------------------------------------
  // LOCATION
  // -------------------------------------------------------------------------
  location: buildSchema({
    entityName: 'Location',
    tableName: 'location',
    description: 'Location entity',
    formMaxWidth: '700px',
    customListColumns: {},
    formTabs: [
      {
        name: 'General',
        order: 1,
        sections: [
          {
            name: 'Details',
            order: 1,
            fields: [
              field({ name: 'name', order: 1, type: 'string', default: '', required: true, label: 'Name', dbField: 'name', maxLength: 200, placeholder: 'Location', filertable: ['main'], showOn: ['list', 'form'] }),
              field({ name: 'type', order: 2, type: 'string', default: '', required: true, label: 'Type', dbField: 'type', maxLength: 20, enumValues: ['Warehouse', 'Apartment', 'Ofice', 'Retail', 'Hotel', 'Building', 'Other'], placeholder: 'Warehouse', showOn: ['list', 'form'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
          {
            name: 'Address',
            order: 2,
            fields: [
              field({ name: 'street', order: 1, type: 'string', default: '', required: true, label: 'Street', dbField: 'street', maxLength: 200, placeholder: '1234 Street', showOn: ['form'] }),
              field({ name: 'street2', order: 2, type: 'string', default: '', required: false, label: 'Street2', dbField: 'street2', maxLength: 100, placeholder: 'Unit A', showOn: ['form'] }),
              field({ name: 'city', order: 3, type: 'string', default: '', required: true, label: 'City', dbField: 'city', maxLength: 100, placeholder: 'City', showOn: ['form'] }),
              field({ name: 'state', order: 4, type: 'string', default: '', required: true, label: 'State', dbField: 'state', maxLength: 50, placeholder: 'State', showOn: ['form'] }),
              field({ name: 'zip', order: 5, type: 'string', default: '', required: true, label: 'Zip', dbField: 'zip', placeholder: 'Zip', showOn: ['form'], maxLength: 20 }),
              field({ name: 'country', order: 6, type: 'country', default: '', required: true, label: 'Country', dbField: 'country', maxLength: 100, placeholder: 'USA', showOn: ['form'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
          {
            name: 'Status',
            order: 3,
            maxWidth: '100px',
            flexGrow: 0,
            flexShrink: 0,
            flex: 1,
            fields: [
              field({ name: 'active', order: 2, type: 'boolean', default: true, required: false, label: 'Active', dbField: 'active', showOn: ['list', 'form'] }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
      {
        name: 'Additional Info',
        order: 2,
        sections: [
          {
            name: 'Notes',
            order: 1,
            fields: [
              field({ name: 'notes', order: 1, type: 'string', default: '', required: false, label: 'Notes', dbField: 'notes', showOn: ['form'] }),
            ],
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
          },
          {
            name: 'Audit',
            order: 3,
            maxWidth: '200px',
            flexGrow: 0,
            flexShrink: 0,
            flex: 1,
            fields: [
              field({ name: 'created_at', order: 1, type: 'date', default: null, disable: true, label: 'Created At', dbField: 'created_at', showOn: ['form'] }),
              field({ name: 'updated_at', order: 2, type: 'date', default: null, disable: true, label: 'Updated At', dbField: 'updated_at', showOn: ['form'] }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
    ],
    entityFields: {
      location_id: field({ name: 'location_id', type: 'number', default: null, readOnly: true, label: 'Id', dbField: 'location_id' }),
      tenant_id: field({ name: 'tenant_id', type: 'number', default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
    },
    relationships: {
      device: { type: 'belongsTo', model: 'Contact', foreignKey: 'contact_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: null },
    },
  }),

  // -------------------------------------------------------------------------
  // CONTACT
  // -------------------------------------------------------------------------
  contact: buildSchema({
    entityName: 'Contact',
    tableName: 'contact',
    description: 'Contact entity for customers, vendors, and other business contacts',
    formMaxWidth: '700px',
    customListColumns: {},
    formTabs: [
      {
        name: 'Contact',
        order: 1,
        sections: [
          {
            name: 'Information',
            order: 1,
            flex: 1,
            minWidth: '300px',
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'name', order: 1, type: 'string', default: '', required: true, label: 'Name', dbField: 'name', minLength: 2, maxLength: 100, placeholder: 'John Doe', filertable: ['main'], showOn: ['list', 'form'] }),
              field({ name: 'company', order: 2, type: 'string', default: '', required: false, label: 'Company', dbField: 'company', maxLength: 200, placeholder: 'Acme Corporation', filertable: ['true'], showOn: ['list', 'form'] }),
              field({ name: 'role', order: 3, type: 'string', default: '', required: false, label: 'Role', dbField: 'role', maxLength: 100, enumValues: ['Vendor', 'Customer', 'Contractor', 'Technician', 'Client', 'Sales Manager'], placeholder: 'Vendor', filertable: ['true'], showOn: ['list', 'form'] }),
              field({ name: 'email', order: 4, type: 'email', default: '', required: true, label: 'Email', dbField: 'email', maxLength: 254, pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', placeholder: 'john@example.com', showOn: ['form'] }),
              field({ name: 'phone', order: 5, type: 'phone', default: '', required: false, label: 'Phone', dbField: 'phone', maxLength: 50, placeholder: '() -', showOn: ['list', 'form'] }),
            ],
          },
          {
            name: 'Status',
            order: 2,
            maxWidth: '100px',
            flexGrow: 0,
            flexShrink: 0,
            flex: 1,
            fields: [
              field({ name: 'active', order: 1, type: 'boolean', default: true, readOnly: false, label: 'Active', dbField: 'active', description: 'Whether the contact is active', showOn: ['list', 'form'] }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
      {
        name: 'Address',
        order: 2,
        sections: [
          {
            name: 'Address Information',
            order: 1,
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'street', order: 1, type: 'string', default: '', required: false, label: 'Street Address', dbField: 'street', maxLength: 200, placeholder: '123 Main St', showOn: ['form'] }),
              field({ name: 'street2', order: 2, type: 'string', default: '', required: false, label: 'Street Address 2', dbField: 'street2', maxLength: 100, placeholder: 'Suite 100', showOn: ['form'] }),
              field({ name: 'city', order: 3, type: 'string', default: '', required: false, label: 'City', dbField: 'city', maxLength: 100, placeholder: 'New York', showOn: ['form'] }),
              field({ name: 'state', order: 4, type: 'string', default: '', required: false, label: 'State', dbField: 'state', maxLength: 50, placeholder: 'NY', showOn: ['form'] }),
              field({ name: 'zip', order: 5, type: 'string', default: '', required: false, label: 'ZIP Code', dbField: 'zip', maxLength: 20, pattern: '^[0-9]{5}(-[0-9]{4})?$', placeholder: '10001', showOn: ['form'] }),
              field({ name: 'country', order: 6, type: 'country', default: 'US', required: false, label: 'Country', dbField: 'country', maxLength: 100, placeholder: 'USA', showOn: ['form'] }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
      {
        name: 'Additional Info',
        order: 3,
        sectionOrientation: 'vertical',
        sections: [
          {
            name: 'Notes',
            order: 1,
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'notes', order: 1, type: 'string', default: '', required: false, label: 'Notes', dbField: 'notes', maxLength: 5000, placeholder: 'Additional notes...', showOn: ['form'] }),
            ],
          },
          {
            name: 'Audit',
            order: 2,
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'created_at', order: 1, type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at', showOn: ['form'] }),
              field({ name: 'updated_at', order: 2, type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at', showOn: ['form'] }),
            ],
          },
        ],
        visibleFor: null,
      },
    ],
    entityFields: {
      contact_id: field({ name: 'contact_id', type: 'number', default: null, readOnly: true, label: 'ID', dbField: 'contact_id' }),
      tenant_id: field({ name: 'tenant_id', type: 'number', default: 0, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
    },
    relationships: {},
  }),

  // -------------------------------------------------------------------------
  // DEVICE
  // -------------------------------------------------------------------------
  device: buildSchema({
    entityName: 'Device',
    tableName: 'device',
    description: 'Device entity',
    formMaxWidth: '770px',
    customListColumns: {},
    formTabs: [
      {
        name: 'General',
        order: 1,
        sections: [
          {
            name: '',
            order: 1,
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'manufacturer', order: 1, type: 'string', default: '', required: true, readOnly: true, label: 'Manufacturer', dbField: 'manufacturer', maxLength: 255, placeholder: 'DENT Instruments', enumValues: DEVICE_MANUFACTURERS, showOn: ['list', 'form'], filertable: ['true'] }),
              field({ name: 'model_number', order: 2, type: 'string', default: '', required: true, readOnly: true, label: 'Model Number', dbField: 'model_number', maxLength: 255, placeholder: 'Model', showOn: ['list', 'form'] }),
              field({ name: 'description', order: 3, type: 'string', default: '', required: false, readOnly: true, label: 'Description', dbField: 'description', maxLength: 50, placeholder: 'Device description', showOn: ['list', 'form'], filertable: ['main'] }),
              field({ name: 'type', order: 4, type: 'string', default: '', required: true, readOnly: true, label: 'Type', dbField: 'type', maxLength: 255, enumValues: DEVICE_TYPES, placeholder: 'Electric', showOn: ['list', 'form'], filertable: ['true'] }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
      {
        name: 'Registers',
        order: 2,
        sections: [
          {
            name: '',
            order: 1,
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'registers', order: 1, type: 'object', default: null, required: false, readOnly: true, label: 'Registers', showOn: ['form'] }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
    ],
    entityFields: {
      device_id: field({ name: 'device_id', order: 1, type: 'number', default: null, readOnly: true, label: 'Id', dbField: 'device_id' }),
    },
    relationships: {},
  }),

  // -------------------------------------------------------------------------
  // USER
  // -------------------------------------------------------------------------
  user: buildSchema({
    entityName: 'User',
    tableName: 'users',
    description: 'User entity for authentication and authorization',
    formMaxWidth: '700px',
    customListColumns: {},
    formTabs: [
      {
        name: 'General',
        order: 1,
        sections: [
          {
            name: 'Information',
            order: 1,
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'name', order: 1, type: 'string', default: '', required: true, label: 'Name', dbField: 'name', maxLength: 100, placeholder: 'John Doe', filertable: ['main'], showOn: ['list', 'form'] }),
              field({ name: 'email', order: 2, type: 'email', default: '', required: true, label: 'Email', dbField: 'email', maxLength: 254, placeholder: 'email@yahoo.com', showOn: ['list', 'form'] }),
              field({ name: 'phone', order: 3, type: 'phone', default: '', required: true, label: 'Phone', dbField: 'phone', maxLength: 20, placeholder: '(xxx) xxx-xxxx', showOn: ['list', 'form'] }),
              field({ name: 'password', order: 3, type: 'password', default: '', required: true, label: 'Password', dbField: 'password', maxLength: 200, placeholder: '********', showOn: ['form'] }),
              field({ name: 'role', order: 4, type: 'string', default: 'viewer', required: false, label: 'Role', dbField: 'role', maxLength: 20, enumValues: ['admin', 'manager', 'technician', 'viewer'], placeholder: 'viewer', filertable: ['true'], showOn: ['list', 'form'] }),
            ],
          },
          {
            name: 'Status',
            order: 2,
            maxWidth: '100px',
            flexGrow: 0,
            flexShrink: 0,
            flex: 1,
            fields: [
              field({ name: 'active', order: 1, type: 'boolean', default: true, required: false, label: 'Active', dbField: 'active', showOn: ['list', 'form'] }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
      {
        name: 'Security',
        order: 2,
        sections: [
          {
            name: 'Permissions',
            order: 1,
            maxWidth: '400px',
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'permissions', order: 1, type: 'json', default: {}, required: false, label: '', dbField: 'permissions', showOn: ['form'] }),
            ],
          },
          {
            name: 'Password Reset',
            order: 2,
            maxWidth: '200px',
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            fields: [
              field({ name: 'password_reset_actions', order: 1, type: 'string', default: '', required: false, label: 'Password Management', dbField: '', readOnly: true, showOn: ['form'], description: 'Actions for managing user password' }),
              field({ name: 'password_reset_token', order: 2, type: 'string', default: '', required: false, label: 'Reset Token', dbField: 'password_reset_token', maxLength: 200, readOnly: true, showOn: ['form'], placeholder: 'No active reset', description: 'Active password reset token if one exists' }),
              field({ name: 'password_reset_expires_at', order: 3, type: 'date', default: null, required: false, label: 'Token Expires', dbField: 'password_reset_expires_at', readOnly: true, showOn: ['form'], placeholder: 'No expiration', description: 'When the reset token expires' }),
            ],
          },
        ],
        sectionOrientation: null,
        visibleFor: null,
      },
    ],
    entityFields: {
      users_id: field({ name: 'users_id', type: 'number', default: null, readOnly: true, label: 'ID', dbField: 'users_id' }),
      tenant_id: field({ name: 'tenant_id', type: 'number', default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
      passwordHash: field({ name: 'passwordHash', type: 'string', default: '', required: false, label: 'Password Hash', dbField: 'passwordhash', maxLength: 200, readOnly: true }),
      createdAt: field({ name: 'createdAt', type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
      updatedAt: field({ name: 'updatedAt', type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
      lastLogin: field({ name: 'lastLogin', type: 'date', default: null, readOnly: true, label: 'Last Login', dbField: 'last_login_at' }),
      passwordChangedAt: field({ name: 'passwordChangedAt', type: 'date', default: null, readOnly: true, label: 'Password Changed At', dbField: 'password_changed_at' }),
      failedLoginAttempts: field({ name: 'failedLoginAttempts', type: 'number', default: 0, readOnly: false, label: 'Failed Login Attempts', dbField: 'failed_login_attempts' }),
      lockedUntil: field({ name: 'lockedUntil', type: 'date', default: null, readOnly: false, label: 'Locked Until', dbField: 'locked_until' }),
    },
    relationships: {
      tenant: { type: 'belongsTo', model: 'Tenant', foreignKey: 'tenant_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: null },
    },
  }),

  // -------------------------------------------------------------------------
  // TENANT
  // -------------------------------------------------------------------------
  tenant: buildSchema({
    entityName: 'Tenant',
    tableName: 'tenant',
    description: 'Tenant entity for multi-tenant isolation',
    customListColumns: {},
    formFields: {
      name: field({ type: 'string', default: '', required: true, label: 'Name', dbField: 'name', maxLength: 100, placeholder: 'Company Name' }),
      url: field({ type: 'url', default: '', required: false, label: 'Website URL', dbField: 'url', maxLength: 255, placeholder: 'https://example.com' }),
      street: field({ type: 'string', default: '', required: false, label: 'Street Address', dbField: 'street', maxLength: 100, placeholder: '123 Main St' }),
      street2: field({ type: 'string', default: '', required: false, label: 'Street Address 2', dbField: 'street2', maxLength: 100, placeholder: 'Suite 100' }),
      city: field({ type: 'string', default: '', required: false, label: 'City', dbField: 'city', maxLength: 50, placeholder: 'New York' }),
      state: field({ type: 'string', default: '', required: false, label: 'State', dbField: 'state', maxLength: 50, placeholder: 'NY' }),
      zip: field({ type: 'string', default: '', required: false, label: 'ZIP Code', dbField: 'zip', maxLength: 15, placeholder: '10001' }),
      country: field({ type: 'country', default: 'US', required: false, label: 'Country', dbField: 'country', maxLength: 50, placeholder: 'USA' }),
      active: field({ type: 'boolean', default: true, required: false, label: 'Active', dbField: 'active', description: 'Whether the tenant is active' }),
      meterReadingBatchCount: field({ type: 'number', default: 0, required: false, label: 'Meter Reading Batch Count', dbField: 'meter_reading_batch_count', description: 'Number of meter reading batches processed' }),
    },
    entityFields: {
      tenant_id: field({ name: 'tenant_id', type: 'number', default: null, readOnly: true, label: 'ID', dbField: 'tenant_id' }),
      createdAt: field({ type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
      updatedAt: field({ type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
    },
    relationships: {
      users: { type: 'hasMany', model: 'User', foreignKey: 'tenant_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: 'users' },
      contacts: { type: 'hasMany', model: 'Contact', foreignKey: 'contact_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: 'contacts' },
      devices: { type: 'hasMany', model: 'Device', foreignKey: 'device_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: 'devices' },
    },
  }),

  // -------------------------------------------------------------------------
  // METER READINGS
  // -------------------------------------------------------------------------
  meter_reading: buildSchema({
    entityName: 'MeterReadings',
    tableName: 'meter_reading',
    description: 'MeterReadings entity',
    customListColumns: {},
    formFields: {
      source: field({ type: 'string', default: '', required: false, label: 'Source', dbField: 'source', maxLength: 100 }),
      quality: field({ type: 'string', default: '', required: false, label: 'Quality', dbField: 'quality', maxLength: 20 }),
      voltage: field({ type: 'number', default: 0, required: false, label: 'Voltage', dbField: 'voltage' }),
      current: field({ type: 'number', default: 0, required: false, label: 'Current', dbField: 'current' }),
      power: field({ type: 'number', default: 0, required: false, label: 'Power', dbField: 'power' }),
      energy: field({ type: 'number', default: 0, required: false, label: 'Energy', dbField: 'energy' }),
      frequency: field({ type: 'number', default: 0, required: false, label: 'Frequency', dbField: 'frequency' }),
      powerfactor: field({ type: 'number', default: 0, required: false, label: 'Powerfactor', dbField: 'powerfactor' }),
      temperature: field({ type: 'number', default: 0, required: false, label: 'Temperature', dbField: 'temperature' }),
      kwh: field({ type: 'number', default: 0, required: false, label: 'Kwh', dbField: 'kwh' }),
      kw: field({ type: 'number', default: 0, required: false, label: 'Kw', dbField: 'kw' }),
      v: field({ type: 'number', default: 0, required: false, label: 'V', dbField: 'v' }),
      a: field({ type: 'number', default: 0, required: false, label: 'A', dbField: 'a' }),
      dpf: field({ type: 'number', default: 0, required: false, label: 'Dpf', dbField: 'dpf' }),
      dpfchannel: field({ type: 'number', default: 0, required: false, label: 'Dpfchannel', dbField: 'dpfchannel' }),
      kwpeak: field({ type: 'number', default: 0, required: false, label: 'Kwpeak', dbField: 'kwpeak' }),
      kvarh: field({ type: 'number', default: 0, required: false, label: 'Kvarh', dbField: 'kvarh' }),
      kvah: field({ type: 'number', default: 0, required: false, label: 'Kvah', dbField: 'kvah' }),
      phaseavoltage: field({ type: 'number', default: 0, required: false, label: 'Phaseavoltage', dbField: 'phaseavoltage' }),
      phasebvoltage: field({ type: 'number', default: 0, required: false, label: 'Phasebvoltage', dbField: 'phasebvoltage' }),
      phasecvoltage: field({ type: 'number', default: 0, required: false, label: 'Phasecvoltage', dbField: 'phasecvoltage' }),
      phaseacurrent: field({ type: 'number', default: 0, required: false, label: 'Phaseacurrent', dbField: 'phaseacurrent' }),
      phasebcurrent: field({ type: 'number', default: 0, required: false, label: 'Phasebcurrent', dbField: 'phasebcurrent' }),
      phaseccurrent: field({ type: 'number', default: 0, required: false, label: 'Phaseccurrent', dbField: 'phaseccurrent' }),
      phaseapower: field({ type: 'number', default: 0, required: false, label: 'Phaseapower', dbField: 'phaseapower' }),
      phasebpower: field({ type: 'number', default: 0, required: false, label: 'Phasebpower', dbField: 'phasebpower' }),
      phasecpower: field({ type: 'number', default: 0, required: false, label: 'Phasecpower', dbField: 'phasecpower' }),
      deviceIp: field({ type: 'string', default: '', required: false, label: 'Device Ip', dbField: 'device_ip', maxLength: 50 }),
      port: field({ type: 'number', default: 0, required: false, label: 'Port', dbField: 'port' }),
      powerFactor: field({ type: 'string', default: '', required: false, label: 'Power Factor', dbField: 'power_factor' }),
      phaseAVoltage: field({ type: 'string', default: '', required: false, label: 'Phase A Voltage', dbField: 'phase_a_voltage' }),
      phaseBVoltage: field({ type: 'string', default: '', required: false, label: 'Phase B Voltage', dbField: 'phase_b_voltage' }),
      phaseCVoltage: field({ type: 'string', default: '', required: false, label: 'Phase C Voltage', dbField: 'phase_c_voltage' }),
      phaseACurrent: field({ type: 'string', default: '', required: false, label: 'Phase A Current', dbField: 'phase_a_current' }),
      phaseBCurrent: field({ type: 'string', default: '', required: false, label: 'Phase B Current', dbField: 'phase_b_current' }),
      phaseCCurrent: field({ type: 'string', default: '', required: false, label: 'Phase C Current', dbField: 'phase_c_current' }),
      phaseAPower: field({ type: 'string', default: '', required: false, label: 'Phase A Power', dbField: 'phase_a_power' }),
      phaseBPower: field({ type: 'string', default: '', required: false, label: 'Phase B Power', dbField: 'phase_b_power' }),
      phaseCPower: field({ type: 'string', default: '', required: false, label: 'Phase C Power', dbField: 'phase_c_power' }),
      lineToLineVoltageAb: field({ type: 'string', default: '', required: false, label: 'Line To Line Voltage Ab', dbField: 'line_to_line_voltage_ab' }),
      lineToLineVoltageBc: field({ type: 'string', default: '', required: false, label: 'Line To Line Voltage Bc', dbField: 'line_to_line_voltage_bc' }),
      lineToLineVoltageCa: field({ type: 'string', default: '', required: false, label: 'Line To Line Voltage Ca', dbField: 'line_to_line_voltage_ca' }),
      totalActivePower: field({ type: 'string', default: '', required: false, label: 'Total Active Power', dbField: 'total_active_power' }),
      totalReactivePower: field({ type: 'string', default: '', required: false, label: 'Total Reactive Power', dbField: 'total_reactive_power' }),
      totalApparentPower: field({ type: 'string', default: '', required: false, label: 'Total Apparent Power', dbField: 'total_apparent_power' }),
      totalActiveEnergyWh: field({ type: 'string', default: '', required: false, label: 'Total Active Energy Wh', dbField: 'total_active_energy_wh' }),
      totalReactiveEnergyVarh: field({ type: 'string', default: '', required: false, label: 'Total Reactive Energy Varh', dbField: 'total_reactive_energy_varh' }),
      totalApparentEnergyVah: field({ type: 'string', default: '', required: false, label: 'Total Apparent Energy Vah', dbField: 'total_apparent_energy_vah' }),
      frequencyHz: field({ type: 'string', default: '', required: false, label: 'Frequency Hz', dbField: 'frequency_hz' }),
      temperatureC: field({ type: 'string', default: '', required: false, label: 'Temperature C', dbField: 'temperature_c' }),
      humidity: field({ type: 'string', default: '', required: false, label: 'Humidity', dbField: 'humidity' }),
      neutralCurrent: field({ type: 'string', default: '', required: false, label: 'Neutral Current', dbField: 'neutral_current' }),
      phaseAPowerFactor: field({ type: 'string', default: '', required: false, label: 'Phase A Power Factor', dbField: 'phase_a_power_factor' }),
      phaseBPowerFactor: field({ type: 'string', default: '', required: false, label: 'Phase B Power Factor', dbField: 'phase_b_power_factor' }),
      phaseCPowerFactor: field({ type: 'string', default: '', required: false, label: 'Phase C Power Factor', dbField: 'phase_c_power_factor' }),
      voltageThd: field({ type: 'string', default: '', required: false, label: 'Voltage Thd', dbField: 'voltage_thd' }),
      currentThd: field({ type: 'string', default: '', required: false, label: 'Current Thd', dbField: 'current_thd' }),
      maxDemandKw: field({ type: 'string', default: '', required: false, label: 'Max Demand Kw', dbField: 'max_demand_kw' }),
      maxDemandKvar: field({ type: 'string', default: '', required: false, label: 'Max Demand Kvar', dbField: 'max_demand_kvar' }),
      maxDemandKva: field({ type: 'string', default: '', required: false, label: 'Max Demand Kva', dbField: 'max_demand_kva' }),
      voltageUnbalance: field({ type: 'string', default: '', required: false, label: 'Voltage Unbalance', dbField: 'voltage_unbalance' }),
      currentUnbalance: field({ type: 'string', default: '', required: false, label: 'Current Unbalance', dbField: 'current_unbalance' }),
      communicationStatus: field({ type: 'string', default: '', required: false, label: 'Communication Status', dbField: 'communication_status', maxLength: 20 }),
      deviceModel: field({ type: 'string', default: '', required: false, label: 'Device Model', dbField: 'device_model', maxLength: 100 }),
      firmwareVersion: field({ type: 'string', default: '', required: false, label: 'Firmware Version', dbField: 'firmware_version', maxLength: 100 }),
      serial_number: field({ type: 'string', default: '', required: false, label: 'Serial Number', dbField: 'serial_number', maxLength: 100 }),
      alarmStatus: field({ type: 'string', default: '', required: false, label: 'Alarm Status', dbField: 'alarm_status', maxLength: 20 }),
      dataQuality: field({ type: 'string', default: '', required: false, label: 'Data Quality', dbField: 'data_quality', maxLength: 20 }),
      rawBasic: field({ type: 'string', default: '', required: false, label: 'Raw Basic', dbField: 'raw_basic' }),
      rawExtended: field({ type: 'string', default: '', required: false, label: 'Raw Extended', dbField: 'raw_extended' }),
      importActiveEnergyWh: field({ type: 'string', default: '', required: false, label: 'Import Active Energy Wh', dbField: 'import_active_energy_wh' }),
      exportActiveEnergyWh: field({ type: 'string', default: '', required: false, label: 'Export Active Energy Wh', dbField: 'export_active_energy_wh' }),
      importReactiveEnergyVarh: field({ type: 'string', default: '', required: false, label: 'Import Reactive Energy Varh', dbField: 'import_reactive_energy_varh' }),
      exportReactiveEnergyVarh: field({ type: 'string', default: '', required: false, label: 'Export Reactive Energy Varh', dbField: 'export_reactive_energy_varh' }),
      groundCurrent: field({ type: 'string', default: '', required: false, label: 'Ground Current', dbField: 'ground_current' }),
      voltageThdPhaseA: field({ type: 'string', default: '', required: false, label: 'Voltage Thd Phase A', dbField: 'voltage_thd_phase_a' }),
      voltageThdPhaseB: field({ type: 'string', default: '', required: false, label: 'Voltage Thd Phase B', dbField: 'voltage_thd_phase_b' }),
      voltageThdPhaseC: field({ type: 'string', default: '', required: false, label: 'Voltage Thd Phase C', dbField: 'voltage_thd_phase_c' }),
      currentThdPhaseA: field({ type: 'string', default: '', required: false, label: 'Current Thd Phase A', dbField: 'current_thd_phase_a' }),
      currentThdPhaseB: field({ type: 'string', default: '', required: false, label: 'Current Thd Phase B', dbField: 'current_thd_phase_b' }),
      currentThdPhaseC: field({ type: 'string', default: '', required: false, label: 'Current Thd Phase C', dbField: 'current_thd_phase_c' }),
      voltageHarmonic_3: field({ type: 'string', default: '', required: false, label: 'Voltage Harmonic 3', dbField: 'voltage_harmonic_3' }),
      voltageHarmonic_5: field({ type: 'string', default: '', required: false, label: 'Voltage Harmonic 5', dbField: 'voltage_harmonic_5' }),
      voltageHarmonic_7: field({ type: 'string', default: '', required: false, label: 'Voltage Harmonic 7', dbField: 'voltage_harmonic_7' }),
      currentHarmonic_3: field({ type: 'string', default: '', required: false, label: 'Current Harmonic 3', dbField: 'current_harmonic_3' }),
      currentHarmonic_5: field({ type: 'string', default: '', required: false, label: 'Current Harmonic 5', dbField: 'current_harmonic_5' }),
      currentHarmonic_7: field({ type: 'string', default: '', required: false, label: 'Current Harmonic 7', dbField: 'current_harmonic_7' }),
      currentDemandKw: field({ type: 'string', default: '', required: false, label: 'Current Demand Kw', dbField: 'current_demand_kw' }),
      currentDemandKvar: field({ type: 'string', default: '', required: false, label: 'Current Demand Kvar', dbField: 'current_demand_kvar' }),
      currentDemandKva: field({ type: 'string', default: '', required: false, label: 'Current Demand Kva', dbField: 'current_demand_kva' }),
      predictedDemandKw: field({ type: 'string', default: '', required: false, label: 'Predicted Demand Kw', dbField: 'predicted_demand_kw' }),
      voltageFlicker: field({ type: 'string', default: '', required: false, label: 'Voltage Flicker', dbField: 'voltage_flicker' }),
      frequencyDeviation: field({ type: 'string', default: '', required: false, label: 'Frequency Deviation', dbField: 'frequency_deviation' }),
      phaseSequence: field({ type: 'string', default: '', required: false, label: 'Phase Sequence', dbField: 'phase_sequence', maxLength: 10 }),
      phaseRotation: field({ type: 'string', default: '', required: false, label: 'Phase Rotation', dbField: 'phase_rotation', maxLength: 10 }),
      powerDirection: field({ type: 'string', default: '', required: false, label: 'Power Direction', dbField: 'power_direction', maxLength: 10 }),
      reactiveDirection: field({ type: 'string', default: '', required: false, label: 'Reactive Direction', dbField: 'reactive_direction', maxLength: 12 }),
      lastCommunication: field({ type: 'date', default: '', required: false, label: 'Last Communication', dbField: 'last_communication' }),
      manufacturerCode: field({ type: 'number', default: 0, required: false, label: 'Manufacturer Code', dbField: 'manufacturer_code' }),
      deviceTime: field({ type: 'date', default: '', required: false, label: 'Device Time', dbField: 'device_time' }),
      syncStatus: field({ type: 'string', default: '', required: false, label: 'Sync Status', dbField: 'sync_status', maxLength: 20 }),
      timeSource: field({ type: 'string', default: '', required: false, label: 'Time Source', dbField: 'time_source', maxLength: 20 }),
      eventCounter: field({ type: 'number', default: 0, required: false, label: 'Event Counter', dbField: 'event_counter' }),
      lastEvent: field({ type: 'string', default: '', required: false, label: 'Last Event', dbField: 'last_event' }),
      currentTransformerRatio: field({ type: 'string', default: '', required: false, label: 'Current Transformer Ratio', dbField: 'current_transformer_ratio' }),
      voltageTransformerRatio: field({ type: 'string', default: '', required: false, label: 'Voltage Transformer Ratio', dbField: 'voltage_transformer_ratio' }),
      pulseConstant: field({ type: 'string', default: '', required: false, label: 'Pulse Constant', dbField: 'pulse_constant' }),
      status: field({ type: 'string', default: '', required: false, label: 'Status', dbField: 'status', maxLength: 20 }),
      unitOfMeasurement: field({ type: 'string', default: '', required: false, label: 'Unit Of Measurement', dbField: 'unit_of_measurement', maxLength: 20 }),
      meterId: field({ type: 'number', default: 0, required: false, label: 'Meter Id', dbField: 'meter_id' }),
    },
    entityFields: {
      meter_reading_id: field({ name: 'meter_reading_id', type: 'string', default: null, readOnly: true, label: 'Id', dbField: 'meter_reading_id' }),
      createdat: field({ name: 'createdat', type: 'date', default: null, readOnly: true, label: 'Createdat', dbField: 'created_at' }),
      tenantId: field({ name: 'tenantId', type: 'number', default: null, readOnly: true, label: 'Tenant Id', dbField: 'tenant_id' }),
    },
    relationships: {
      meter: { type: 'belongsTo', model: 'Meter', foreignKey: 'meter_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: null },
    },
  }),

  // Alias for frontend compatibility
  meterReadings: { $ref: 'meter_reading' },

  // -------------------------------------------------------------------------
  // METER ELEMENTS
  // -------------------------------------------------------------------------
  meterElements: buildSchema({
    entityName: 'MeterElement',
    tableName: 'meter_element',
    description: 'Meter element entity for managing individual elements within a meter',
    customListColumns: {},
    formFields: {
      element: field({ type: 'string', default: '', required: true, label: 'Element', dbField: 'element', maxLength: 255, placeholder: 'Enter element value', enumValues: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], showOn: ['form'] }),
      name: field({ type: 'string', default: '', required: true, label: 'Name', dbField: 'name', maxLength: 255, placeholder: 'Enter element name', showOn: ['list', 'form'] }),
    },
    entityFields: {
      meter_element_id: field({ name: 'meter_element_id', type: 'number', default: null, readOnly: true, label: 'ID', dbField: 'meter_element_id' }),
      meter_id: field({ name: 'meter_id', type: 'number', default: null, readOnly: true, label: 'Meter ID', dbField: 'meter_id' }),
      tenant_id: field({ name: 'tenant_id', type: 'number', default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
      created_at: field({ name: 'created_at', type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
      updated_at: field({ name: 'updated_at', type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
    },
  }),

  // -------------------------------------------------------------------------
  // REPORT
  // -------------------------------------------------------------------------
  report: buildSchema({
    entityName: 'Report',
    tableName: 'report',
    description: 'Scheduled report configuration for automated email delivery',
    formMaxWidth: '600px',
    formTabs: [
      {
        name: 'General', order: 1, sectionOrientation: null, visibleFor: null,
        sections: [{
          name: 'Details', order: 1, flex: 1, flexGrow: 1, flexShrink: 1,
          fields: [
            field({ name: 'name', order: 1, type: 'string', default: '', required: true, label: 'Report Name', dbField: 'name', minLength: 1, maxLength: 255, placeholder: 'Monthly Usage Report', filterable: ['main'], showOn: ['list', 'form'] }),
            field({ name: 'type', order: 2, type: 'select', default: 'meter_readings', required: true, label: 'Report Type', dbField: 'type', enumValues: ['meter_readings', 'usage_summary', 'daily_summary'], enumLabels: { meter_readings: 'Meter Readings', usage_summary: 'Usage Summary', daily_summary: 'Daily Summary' }, filterable: ['true'], showOn: ['list', 'form'] }),
            field({ name: 'active', order: 3, type: 'boolean', default: true, required: false, label: 'Active', dbField: 'active', filterable: ['true'], showOn: ['list', 'form'] }),
          ],
        }],
      },
      {
        name: 'Schedule', order: 2, sectionOrientation: null, visibleFor: null,
        sections: [{
          name: 'Execution Schedule', order: 1, flex: 1, flexGrow: 1, flexShrink: 1,
          fields: [
            field({ name: 'schedule', order: 1, type: 'string', default: '', required: true, label: 'Schedule', dbField: 'schedule', placeholder: 'Daily at 9 AM', helpText: 'Cron format: minute hour day month day-of-week.', showOn: ['form'], customField: true }),
          ],
        }],
      },
      {
        name: 'Recipients', order: 3, sectionOrientation: null, visibleFor: null,
        sections: [{
          name: 'Email Recipients', order: 1, flex: 1, flexGrow: 1, flexShrink: 1,
          fields: [
            field({ name: 'recipients', order: 1, type: 'string', default: [], required: true, label: 'Email Recipients', dbField: 'recipients', placeholder: 'user@example.com', helpText: 'Add email addresses to receive the report', showOn: ['form'], customField: true }),
          ],
        }],
      },
      {
        name: 'Configuration', order: 4, sectionOrientation: null, visibleFor: null,
        sections: [{
          name: 'Type-Specific Settings', order: 1, flex: 1, flexGrow: 1, flexShrink: 1,
          fields: [
            field({ name: 'config', order: 1, type: 'string', default: {}, required: false, label: 'Configuration', dbField: 'config', placeholder: 'Type-specific configuration', helpText: 'Configuration options specific to the selected report type', showOn: ['form'], customField: true }),
          ],
        }],
      },
      {
        name: 'Meters & Elements', order: 5, sectionOrientation: null, visibleFor: null,
        sections: [{
          name: 'Select Meters and Elements', order: 1, flex: 1, flexGrow: 1, flexShrink: 1,
          fields: [
            field({ name: 'meter_ids', order: 1, type: 'custom', label: 'Meters and Elements', required: false, default: [], showOn: ['form'], customField: true }),
            field({ name: 'element_ids', order: 2, type: 'custom', label: 'Selected Elements', required: false, default: [], showOn: ['form'], customField: true }),
          ],
        }],
      },
      {
        name: 'Registers', order: 6, sectionOrientation: null, visibleFor: null,
        sections: [{
          name: 'Select Registers', order: 1, flex: 1, flexGrow: 1, flexShrink: 1,
          fields: [
            field({ name: 'register_ids', order: 1, type: 'custom', label: 'Registers', required: false, default: [], showOn: ['form'], customField: true }),
          ],
        }],
      },
      {
        name: 'Formatting', order: 7, sectionOrientation: null, visibleFor: null,
        sections: [{
          name: 'Output Format', order: 1, flex: 1, flexGrow: 1, flexShrink: 1,
          fields: [
            field({ name: 'html_format', order: 1, type: 'boolean', label: 'Enable HTML Formatting', required: false, default: false, showOn: ['form'] }),
          ],
        }],
      },
    ],
  }),

  // -------------------------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------------------------
  dashboard: buildSchema({
    entityName: 'Dashboard',
    tableName: 'dashboard',
    description: 'Dashboard card configuration for displaying aggregated meter reading data',
    customListColumns: {},
    formTabs: [
      {
        name: 'Card Configuration', order: 1, sectionOrientation: null, visibleFor: null,
        sections: [
          { name: 'Basic Information', order: 1, minWidth: '350px', flex: 1, flexGrow: 1, flexShrink: 1, fields: [
            field({ name: 'card_name', order: 1, type: 'string', default: '', required: true, label: 'Card Name', dbField: 'card_name', minLength: 1, maxLength: 255, placeholder: 'Enter card name', showOn: ['list', 'form'] }),
            field({ name: 'card_description', order: 2, type: 'string', default: '', required: false, label: 'Description', dbField: 'card_description', maxLength: 1000, placeholder: 'Enter card description', showOn: ['form'] }),
            field({ name: 'meter_element_id', order: 3, type: 'number', default: null, required: true, label: 'Meter Element', dbField: 'meter_element_id', min: 1, showOn: ['list', 'form'], validate: true, validationFields: ['name'] }),
            field({ name: 'meter_id', order: 4, type: 'number', default: null, required: true, label: 'Meter', dbField: 'meter_id', min: 1, showOn: ['form'], validate: true, validationFields: ['name'] }),
          ]},
          { name: 'Data Selection', order: 2, flex: 1, flexGrow: 1, flexShrink: 1, fields: [
            field({ name: 'selected_columns', order: 1, type: 'object', default: [], required: true, label: 'Selected Power Columns', dbField: 'selected_columns', showOn: ['form'], description: 'Select which power columns to display on this card' }),
          ]},
          { name: 'Time Frame', order: 3, flex: 1, flexGrow: 1, flexShrink: 1, fields: [
            field({ name: 'time_frame_type', order: 1, type: 'string', default: 'last_month', required: true, label: 'Time Frame Type', dbField: 'time_frame_type', enumValues: ['custom', 'last_month', 'this_month_to_date', 'since_installation'], showOn: ['list', 'form'] }),
            field({ name: 'custom_start_date', order: 2, type: 'date', default: null, required: false, label: 'Custom Start Date', dbField: 'custom_start_date', placeholder: 'Select start date', showOn: ['form'], description: 'Required when Time Frame Type is "custom"' }),
            field({ name: 'custom_end_date', order: 3, type: 'date', default: null, required: false, label: 'Custom End Date', dbField: 'custom_end_date', placeholder: 'Select end date', showOn: ['form'], description: 'Required when Time Frame Type is "custom"' }),
          ]},
          { name: 'Visualization', order: 4, flex: 1, flexGrow: 1, flexShrink: 1, fields: [
            field({ name: 'visualization_type', order: 1, type: 'string', default: 'line', required: true, label: 'Visualization Type', dbField: 'visualization_type', enumValues: ['pie', 'line', 'candlestick', 'bar', 'area'], showOn: ['list', 'form'] }),
            field({ name: 'grouping_type', order: 2, type: 'string', default: 'daily', required: true, label: 'Data Grouping', dbField: 'grouping_type', enumValues: ['total', 'hourly', 'daily', 'weekly', 'monthly'], showOn: ['list', 'form'], description: 'How to group the aggregated data' }),
          ]},
          { name: 'Grid Layout', order: 5, flex: 1, flexGrow: 1, flexShrink: 1, fields: [
            field({ name: 'grid_x', order: 1, type: 'number', default: null, required: false, label: 'Grid X Position', dbField: 'grid_x', showOn: ['form'] }),
            field({ name: 'grid_y', order: 2, type: 'number', default: null, required: false, label: 'Grid Y Position', dbField: 'grid_y', showOn: ['form'] }),
            field({ name: 'grid_w', order: 3, type: 'number', default: null, required: false, label: 'Grid Width', dbField: 'grid_w', showOn: ['form'] }),
            field({ name: 'grid_h', order: 4, type: 'number', default: null, required: false, label: 'Grid Height', dbField: 'grid_h', showOn: ['form'] }),
          ]},
        ],
      },
      {
        name: 'Additional Info', order: 2, sectionOrientation: 'vertical', visibleFor: null,
        sections: [{ name: 'Audit', order: 1, flex: 1, flexGrow: 1, flexShrink: 1, fields: [
          field({ name: 'created_at', order: 1, type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at', showOn: ['form'] }),
          field({ name: 'updated_at', order: 2, type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at', showOn: ['form'] }),
        ]}],
      },
    ],
    formFields: {
      card_name: field({ type: 'string', default: '', required: true, label: 'Card Name', dbField: 'card_name', minLength: 1, maxLength: 255, showOn: ['list', 'form'] }),
      card_description: field({ type: 'string', default: '', required: false, label: 'Description', dbField: 'card_description', maxLength: 1000, showOn: ['form'] }),
      meter_element_id: field({ type: 'number', default: null, required: true, label: 'Meter Element', dbField: 'meter_element_id', min: 1, showOn: ['list', 'form'], validate: true }),
      meter_id: field({ type: 'number', default: null, required: true, label: 'Meter', dbField: 'meter_id', min: 1, showOn: ['form'], validate: true }),
      selected_columns: field({ type: 'object', default: [], required: true, label: 'Selected Power Columns', dbField: 'selected_columns', showOn: ['form'] }),
      time_frame_type: field({ type: 'string', default: 'last_month', required: true, label: 'Time Frame Type', dbField: 'time_frame_type', enumValues: ['custom', 'last_month', 'this_month_to_date', 'since_installation'], showOn: ['list', 'form'] }),
      custom_start_date: field({ type: 'date', default: null, required: false, label: 'Custom Start Date', dbField: 'custom_start_date', showOn: ['form'] }),
      custom_end_date: field({ type: 'date', default: null, required: false, label: 'Custom End Date', dbField: 'custom_end_date', showOn: ['form'] }),
      visualization_type: field({ type: 'string', default: 'line', required: true, label: 'Visualization Type', dbField: 'visualization_type', enumValues: ['pie', 'line', 'candlestick', 'bar', 'area'], showOn: ['list', 'form'] }),
      grouping_type: field({ type: 'string', default: 'daily', required: true, label: 'Data Grouping', dbField: 'grouping_type', enumValues: ['total', 'hourly', 'daily', 'weekly', 'monthly'], showOn: ['list', 'form'] }),
      grid_x: field({ type: 'number', default: null, required: false, label: 'Grid X Position', dbField: 'grid_x', showOn: ['form'] }),
      grid_y: field({ type: 'number', default: null, required: false, label: 'Grid Y Position', dbField: 'grid_y', showOn: ['form'] }),
      grid_w: field({ type: 'number', default: null, required: false, label: 'Grid Width', dbField: 'grid_w', showOn: ['form'] }),
      grid_h: field({ type: 'number', default: null, required: false, label: 'Grid Height', dbField: 'grid_h', showOn: ['form'] }),
    },
    entityFields: {
      dashboard_id: field({ name: 'dashboard_id', type: 'number', default: null, readOnly: true, label: 'ID', dbField: 'dashboard_id' }),
      tenant_id: field({ name: 'tenant_id', type: 'number', default: 0, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
      created_by_users_id: field({ name: 'created_by_users_id', type: 'number', default: null, readOnly: true, label: 'Created By User ID', dbField: 'created_by_users_id' }),
      created_at: field({ name: 'created_at', type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
      updated_at: field({ name: 'updated_at', type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
    },
    relationships: {
      meterElement: { type: 'belongsTo', model: 'MeterElement', foreignKey: 'meter_element_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: null },
      meter: { type: 'belongsTo', model: 'Meter', foreignKey: 'meter_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: null },
      createdByUser: { type: 'belongsTo', model: 'User', foreignKey: 'created_by_users_id', targetKey: 'users_id', through: null, autoLoad: false, select: null, as: null },
    },
  }),

  // -------------------------------------------------------------------------
  // AUTH LOGS
  // -------------------------------------------------------------------------
  authLogs: buildSchema({
    entityName: 'AuthLogs',
    tableName: 'auth_logs',
    description: 'Authentication logs entity for tracking login and auth events',
    customListColumns: {},
    formFields: {
      userId: field({ type: 'number', default: 0, required: true, label: 'User ID', dbField: 'user_id' }),
      eventType: field({ type: 'string', default: '', required: true, label: 'Event Type', dbField: 'event_type', maxLength: 50 }),
      status: field({ type: 'string', default: '', required: true, label: 'Status', dbField: 'status', maxLength: 20 }),
      ipAddress: field({ type: 'string', default: '', required: false, label: 'IP Address', dbField: 'ip_address' }),
      userAgent: field({ type: 'string', default: '', required: false, label: 'User Agent', dbField: 'user_agent' }),
      details: field({ type: 'json', default: {}, required: false, label: 'Details', dbField: 'details' }),
    },
    entityFields: {
      authLogsId: field({ name: 'auth_logs_id', type: 'number', default: null, readOnly: true, label: 'Auth Logs ID', dbField: 'auth_logs_id' }),
      createdAt: field({ type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
    },
    relationships: {
      user: { type: 'belongsTo', model: 'User', foreignKey: 'user_id', targetKey: 'id', through: null, autoLoad: false, select: null, as: null },
    },
  }),

  // -------------------------------------------------------------------------
  // EMAIL TEMPLATES (commented out in Node.js but keep basic structure)
  // -------------------------------------------------------------------------
  emailTemplates: buildSchema({
    entityName: 'EmailTemplate',
    tableName: 'email_template',
    description: 'Email notification templates',
    formFields: {
      name: field({ type: 'string', default: '', required: true, label: 'Name', dbField: 'name', maxLength: 255 }),
      subject: field({ type: 'string', default: '', required: true, label: 'Subject', dbField: 'subject', maxLength: 500 }),
      content: field({ type: 'string', default: '', required: true, label: 'Content', dbField: 'content' }),
      category: field({ type: 'string', default: '', required: true, label: 'Category', dbField: 'category', maxLength: 50 }),
      variables: field({ type: 'object', default: null, required: false, label: 'Variables', dbField: 'variables' }),
      isdefault: field({ type: 'boolean', default: false, required: false, label: 'Is Default', dbField: 'isdefault' }),
      isactive: field({ type: 'boolean', default: true, required: false, label: 'Is Active', dbField: 'isactive' }),
      usagecount: field({ type: 'number', default: 0, required: false, label: 'Usage Count', dbField: 'usagecount' }),
      lastused: field({ type: 'date', default: '', required: false, label: 'Last Used', dbField: 'lastused' }),
      createdby: field({ type: 'number', default: 0, required: false, label: 'Created By', dbField: 'createdby' }),
    },
    entityFields: {
      email_template_id: field({ name: 'email_template_id', type: 'number', default: null, readOnly: true, label: 'Id', dbField: 'email_template_id' }),
      createdat: field({ type: 'date', default: null, readOnly: true, label: 'Created At', dbField: 'createdat' }),
      updatedat: field({ type: 'date', default: null, readOnly: true, label: 'Updated At', dbField: 'updatedat' }),
      tenantId: field({ type: 'number', default: null, readOnly: true, label: 'Tenant ID', dbField: 'tenant_id' }),
    },
  }),
};

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

function resolveSchema(key: string): any {
  const schema = schemas[key];
  if (!schema) return null;
  if (schema.$ref) return schemas[schema.$ref] || null;
  return schema;
}

// GET / - Get list of all available schemas
app.get('/', (c) => {
  try {
    const availableSchemas = Object.keys(schemas)
      .filter((k) => !schemas[k].$ref)
      .map((entityName) => {
        const schema = schemas[entityName];
        return {
          entityName: schema.entityName,
          tableName: schema.tableName,
          description: schema.description,
          endpoint: `/api/schema/${entityName}`,
        };
      });

    return c.json({
      success: true,
      data: {
        schemas: availableSchemas,
        count: availableSchemas.length,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to fetch schema list', error: error.message }, 500);
  }
});

// GET /:entity - Get schema for a specific entity
app.get('/:entity', (c) => {
  try {
    const entity = c.req.param('entity');
    const schema = resolveSchema(entity);

    if (!schema) {
      return c.json({ success: false, message: `Schema not found for entity: ${entity}`, availableEntities: Object.keys(schemas) }, 404);
    }

    return c.json({ success: true, data: schema });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to fetch schema', error: error.message }, 500);
  }
});

// POST /:entity/validate - Validate data against entity schema
app.post('/:entity/validate', async (c) => {
  try {
    const entity = c.req.param('entity');
    const schema = resolveSchema(entity);

    if (!schema) {
      return c.json({ success: false, message: `Schema not found for entity: ${entity}` }, 404);
    }

    const data = await c.req.json();
    const errors: Record<string, string> = {};

    if (schema.formFields) {
      for (const [fieldName, def] of Object.entries(schema.formFields) as [string, any][]) {
        if (def.required && (data[fieldName] === undefined || data[fieldName] === null || data[fieldName] === '')) {
          errors[fieldName] = `${def.label || fieldName} is required`;
        }
      }
    }

    return c.json({ success: true, data: { isValid: Object.keys(errors).length === 0, errors } });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to validate data', error: error.message }, 500);
  }
});

export default app;
