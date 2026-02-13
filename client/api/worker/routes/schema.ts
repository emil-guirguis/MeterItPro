/**
 * Schema routes - Hono worker
 *
 * Uses the SAME SchemaDefinition.js framework as the Node.js API.
 * Each entity's defineSchema() call is copied verbatim from its WithSchema model file.
 * The toJSON() pipeline produces identical output to the Node.js API.
 */

import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables, authenticateToken } from '../middleware';

// Import the SAME SchemaDefinition framework used by the Node.js API
// @ts-ignore - CommonJS module
const { defineSchema, field, tab, section, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

// Import shared enumerations
// @ts-ignore - CommonJS module
const { DEVICE_MANUFACTURERS, DEVICE_TYPES } = require('../../src/constants/enumerations');

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Protect all schema routes with authentication
app.use('*', authenticateToken);

// ---------------------------------------------------------------------------
// SCHEMA DEFINITIONS - copied verbatim from each *WithSchema.js model file
// ---------------------------------------------------------------------------

// ===== METER (from MeterWithSchema.js) =====
const meterSchema = defineSchema({
  entityName: 'Meter',
  tableName: 'meter',
  description: 'Meter entity for managing electric, gas, water, and other utility meters',
  formMaxWidth: '770px',

  customListColumns: {},

  formTabs: [
    tab({
      name: 'Meter',
      order: 1,
      minWidth: '400px',
      sections: [
        section({
          name: 'Information',
          order: 1,
          minWidth: '350px',
          fields: [
            field({
              name: 'name',
              order: 1,
              type: FieldTypes.STRING,
              default: '',
              required: true,
              label: 'Meter Name',
              dbField: 'name',
              minLength: 3,
              maxLength: 100,
              placeholder: 'Enter meter name',
              showOn: ['list', 'form'],
              filertable: ['main'],
            }),
            field({
              name: 'serial_number',
              order: 2,
              type: FieldTypes.STRING,
              default: '',
              required: true,
              label: 'Serial Number',
              dbField: 'serial_number',
              maxLength: 200,
              placeholder: 'Enter serial number',
              filertable: ['true'],
              showOn: ['list', 'form'],
              visibleFor: ['physical'],
            }),
            field({
              name: 'device_id',
              order: 3,
              type: FieldTypes.NUMBER,
              default: null,
              required: true,
              label: 'Device',
              dbField: 'device_id',
              min: 1,
              maxLength: 200,
              showOn: ['form'],
              validate: true,
              validationFields: ['manufacturer', 'model_number'],
              visibleFor: ['physical'],
            }),
            field({
              name: 'location_id',
              order: 4,
              type: FieldTypes.NUMBER,
              default: null,
              required: true,
              label: 'Location',
              dbField: 'location_id',
              min: 1,
              showOn: ['form'],
              validate: true,
              validationFields: ['name'],
            }),
            field({
              name: 'type',
              order: 5,
              type: FieldTypes.SELECT,
              default: 'electric',
              required: true,
              label: 'Meter Type',
              dbField: 'type',
              readOnly: false,
              enumValues: ['electric', 'gas', 'water', 'steam', 'other'],
              enumLabels: {
                electric: 'Electric',
                gas: 'Gas',
                water: 'Water',
                steam: 'Steam',
                other: 'Other',
              },
              showOn: ['form', 'list'],
            }),
          ],
        }),

        section({
          name: 'Network',
          order: 2,
          visibleFor: ['physical'],
          fields: [
            field({
              name: 'ip',
              order: 1,
              type: FieldTypes.STRING,
              default: '',
              required: true,
              label: 'IP Address',
              dbField: 'ip',
              placeholder: '192.168.1.100',
              showOn: ['list', 'form'],
            }),
            field({
              name: 'port',
              order: 2,
              type: FieldTypes.NUMBER,
              default: 47808,
              required: true,
              label: 'Port Number',
              dbField: 'port',
              min: 1,
              max: 65535,
              placeholder: '47808',
              showOn: ['form'],
            }),
          ],
        }),
        section({
          name: 'Status',
          order: 3,
          fields: [
            field({
              name: 'active',
              order: 1,
              type: FieldTypes.BOOLEAN,
              default: true,
              required: true,
              label: 'Active',
              dbField: 'active',
              showOn: ['list', 'form'],
              filertable: ['true'],
            }),
            field({
              name: 'installation_date',
              order: 2,
              type: FieldTypes.DATE,
              default: null,
              required: false,
              label: 'Installation Date',
              dbField: 'installation_date',
              placeholder: 'Select date',
              showOn: ['form'],
            }),
            field({
              name: 'is_virtual',
              order: 3,
              type: FieldTypes.SELECT,
              default: 'physical',
              required: true,
              label: 'Physical/Virtual',
              dbField: 'is_virtual',
              readOnly: true,
              enumValues: ['physical', 'virtual'],
              enumLabels: {
                physical: 'Physical',
                virtual: 'Virtual',
              },
              showOn: ['form', 'list'],
            }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Elements',
      order: 2,
      visibleFor: ['physical'],
      sections: [
        section({
          name: 'Meter Elements',
          order: 1,
          fields: [
            field({
              name: 'elements',
              order: 1,
              type: FieldTypes.OBJECT,
              default: null,
              required: false,
              label: 'Elements',
              dbField: null,
              showOn: ['form'],
            }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Combined Meters',
      order: 2,
      visibleFor: ['virtual'],
      sections: [
        section({
          name: 'Combined Meters',
          order: 1,
          fields: [
            field({
              name: 'elements',
              order: 1,
              type: FieldTypes.OBJECT,
              default: null,
              required: false,
              label: 'Elements',
              dbField: null,
              showOn: ['form'],
            }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Additional Info',
      order: 3,
      sectionOrientation: 'vertical',
      sections: [
        section({
          name: 'notes',
          order: 1,
          minWidth: '500px',
          fields: [
            field({
              name: 'notes',
              order: 1,
              type: FieldTypes.STRING,
              default: '',
              required: false,
              label: 'Notes',
              dbField: 'notes',
              maxLength: 500,
              placeholder: 'Enter notes',
              showOn: ['form'],
            }),
          ],
        }),
        section({
          name: 'Audit',
          order: 2,
          fields: [
            field({
              name: 'created_at',
              order: 1,
              type: FieldTypes.DATE,
              default: null,
              readOnly: true,
              label: 'Created At',
              dbField: 'created_at',
            }),
            field({
              name: 'updated_at',
              order: 2,
              type: FieldTypes.DATE,
              default: null,
              readOnly: true,
              label: 'Updated At',
              dbField: 'updated_at',
            }),
          ],
        }),
      ],
    }),
  ],

  formFields: {
    elements: field({
      type: FieldTypes.OBJECT,
      default: null,
      required: false,
      label: 'Elements',
      dbField: null,
      showOn: ['form'],
    }),
    device: field({
      type: FieldTypes.STRING,
      default: '',
      readOnly: true,
      label: 'Device',
      dbField: null,
      showOn: ['list'],
    }),
  },

  entityFields: {
    meter_id: field({
      name: 'meter_id',
      type: FieldTypes.NUMBER,
      default: null,
      readOnly: true,
      label: 'ID',
      dbField: 'meter_id',
    }),
    tenant_id: field({
      name: 'tenant_id',
      type: FieldTypes.NUMBER,
      default: 0,
      readOnly: false,
      label: 'Tenant ID',
      dbField: 'tenant_id',
    }),
  },

  validation: {},
});

// ===== LOCATION (from LocationWithSchema.js) =====
const locationSchema = defineSchema({
  entityName: 'Location',
  tableName: 'location',
  description: 'Location entity',
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
            field({ name: 'name', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 200, placeholder: 'Location', filertable: ['main'], showOn: ['list', 'form'] }),
            field({ name: 'type', order: 2, type: FieldTypes.STRING, default: '', required: true, label: 'Type', dbField: 'type', maxLength: 20, enumValues: ['Warehouse', 'Apartment', 'Ofice', 'Retail', 'Hotel', 'Building', 'Other'], placeholder: 'Warehouse', showOn: ['list', 'form'] }),
          ],
        }),
        section({
          name: 'Address',
          order: 2,
          fields: [
            field({ name: 'street', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Street', dbField: 'street', maxLength: 200, placeholder: '1234 Street', showOn: ['form'] }),
            field({ name: 'street2', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Street2', dbField: 'street2', maxLength: 100, placeholder: 'Unit A', showOn: ['form'] }),
            field({ name: 'city', order: 3, type: FieldTypes.STRING, default: '', required: true, label: 'City', dbField: 'city', maxLength: 100, placeholder: 'City', showOn: ['form'] }),
            field({ name: 'state', order: 4, type: FieldTypes.STRING, default: '', required: true, label: 'State', dbField: 'state', maxLength: 50, placeholder: 'State', showOn: ['form'] }),
            field({ name: 'zip', order: 5, type: FieldTypes.STRING, default: '', required: true, label: 'Zip', dbField: 'zip', placeholder: 'Zip', showOn: ['form'], maxLength: 20 }),
            field({ name: 'country', order: 6, type: FieldTypes.COUNTRY, default: '', required: true, label: 'Country', dbField: 'country', maxLength: 100, placeholder: 'USA', showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Status',
          order: 3,
          maxWidth: '100px',
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            field({ name: 'active', order: 2, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', showOn: ['list', 'form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Additional Info',
      order: 2,
      sections: [
        section({
          name: 'Notes',
          order: 1,
          fields: [
            field({ name: 'notes', order: 1, type: FieldTypes.STRING, default: '', required: false, label: 'Notes', dbField: 'notes', showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Audit',
          order: 3,
          maxWidth: '200px',
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            field({ name: 'created_at', order: 1, type: FieldTypes.DATE, default: null, disable: true, label: 'Created At', dbField: 'created_at', showOn: ['form'] }),
            field({ name: 'updated_at', order: 2, type: FieldTypes.DATE, default: null, disable: true, label: 'Updated At', dbField: 'updated_at', showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    location_id: field({ name: 'location_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Id', dbField: 'location_id' }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
  },

  validation: {},
});

// ===== CONTACT (from ContactWithSchema.js) =====
const contactSchema = defineSchema({
  entityName: 'Contact',
  tableName: 'contact',
  description: 'Contact entity for customers, vendors, and other business contacts',
  formMaxWidth: '700px',

  customListColumns: {},

  formTabs: [
    tab({
      name: 'Contact',
      order: 1,
      sections: [
        section({
          name: 'Information',
          order: 1,
          flex: 1,
          minWidth: '300px',
          fields: [
            field({ name: 'name', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', minLength: 2, maxLength: 100, placeholder: 'John Doe', filertable: ['main'], showOn: ['list', 'form'] }),
            field({ name: 'company', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Company', dbField: 'company', maxLength: 200, placeholder: 'Acme Corporation', filertable: ['true'], showOn: ['list', 'form'] }),
            field({ name: 'role', order: 3, type: FieldTypes.STRING, default: '', required: false, label: 'Role', dbField: 'role', maxLength: 100, enumValues: ['Vendor', 'Customer', 'Contractor', 'Technician', 'Client', 'Sales Manager'], placeholder: 'Vendor', filertable: ['true'], showOn: ['list', 'form'] }),
            field({ name: 'email', order: 4, type: FieldTypes.EMAIL, default: '', required: true, label: 'Email', dbField: 'email', maxLength: 254, pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', placeholder: 'john@example.com', showOn: ['form'] }),
            field({ name: 'phone', order: 5, type: FieldTypes.PHONE, default: '', required: false, label: 'Phone', dbField: 'phone', maxLength: 50, placeholder: '() -', showOn: ['list', 'form'] }),
          ],
        }),
        section({
          name: 'Status',
          order: 2,
          maxWidth: '100px',
          flexGrow: 0,
          flexShrink: 0,
          fields: [
            field({ name: 'active', order: 1, type: FieldTypes.BOOLEAN, default: true, readOnly: false, label: 'Active', dbField: 'active', description: 'Whether the contact is active', showOn: ['list', 'form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Address',
      order: 2,
      sections: [
        section({
          name: 'Address Information',
          order: 1,
          fields: [
            field({ name: 'street', order: 1, type: FieldTypes.STRING, default: '', required: false, label: 'Street Address', dbField: 'street', maxLength: 200, placeholder: '123 Main St', showOn: ['form'] }),
            field({ name: 'street2', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Street Address 2', dbField: 'street2', maxLength: 100, placeholder: 'Suite 100', showOn: ['form'] }),
            field({ name: 'city', order: 3, type: FieldTypes.STRING, default: '', required: false, label: 'City', dbField: 'city', maxLength: 100, placeholder: 'New York', showOn: ['form'] }),
            field({ name: 'state', order: 4, type: FieldTypes.STRING, default: '', required: false, label: 'State', dbField: 'state', maxLength: 50, placeholder: 'NY', showOn: ['form'] }),
            field({ name: 'zip', order: 5, type: FieldTypes.STRING, default: '', required: false, label: 'ZIP Code', dbField: 'zip', maxLength: 20, pattern: '^[0-9]{5}(-[0-9]{4})?$', placeholder: '10001', showOn: ['form'] }),
            field({ name: 'country', order: 6, type: FieldTypes.COUNTRY, default: 'US', required: false, label: 'Country', dbField: 'country', maxLength: 100, placeholder: 'USA', showOn: ['form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Additional Info',
      order: 3,
      sectionOrientation: 'vertical',
      sections: [
        section({
          name: 'Notes',
          order: 1,
          fields: [
            field({ name: 'notes', order: 1, type: FieldTypes.STRING, default: '', required: false, label: 'Notes', dbField: 'notes', maxLength: 5000, placeholder: 'Additional notes...', showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Audit',
          order: 2,
          fields: [
            field({ name: 'created_at', order: 1, type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'created_at', showOn: ['form'] }),
            field({ name: 'updated_at', order: 2, type: FieldTypes.DATE, default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at', showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    contact_id: field({ name: 'contact_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'contact_id' }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: 0, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
  },

  relationships: {},
  validation: {},
});

// ===== DEVICE (from DeviceWithSchema.js) =====
const deviceSchema = defineSchema({
  entityName: 'Device',
  tableName: 'device',
  description: 'Device entity',
  formMaxWidth: '770px',

  customListColumns: {},

  formTabs: [
    tab({
      name: 'General',
      order: 1,
      sections: [
        section({
          name: '',
          order: 1,
          flex: 1,
          fields: [
            field({ name: 'manufacturer', order: 1, type: FieldTypes.STRING, default: '', required: true, readOnly: true, label: 'Manufacturer', dbField: 'manufacturer', maxLength: 255, placeholder: 'DENT Instruments', enumValues: DEVICE_MANUFACTURERS, showOn: ['list', 'form'], filertable: ['true'] }),
            field({ name: 'model_number', order: 2, type: FieldTypes.STRING, default: '', required: true, readOnly: true, label: 'Model Number', dbField: 'model_number', maxLength: 255, placeholder: 'Model', showOn: ['list', 'form'] }),
            field({ name: 'description', order: 3, type: FieldTypes.STRING, default: '', required: false, readOnly: true, label: 'Description', dbField: 'description', maxLength: 50, placeholder: 'Device description', showOn: ['list', 'form'], filertable: ['main'] }),
            field({ name: 'type', order: 4, type: FieldTypes.STRING, default: '', required: true, readOnly: true, label: 'Type', dbField: 'type', maxLength: 255, enumValues: DEVICE_TYPES, placeholder: 'Electric', showOn: ['list', 'form'], filertable: ['true'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Registers',
      order: 2,
      sections: [
        section({
          name: '',
          order: 1,
          fields: [
            field({ name: 'registers', order: 1, type: FieldTypes.OBJECT, default: null, required: false, readOnly: true, label: 'Registers', showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    device_id: field({ name: 'device_id', order: 1, type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Id', dbField: 'device_id' }),
  },

  relationships: {},
  validation: {},
});

// ===== USER (from UserWithSchema.js) =====
const userSchema = defineSchema({
  entityName: 'User',
  tableName: 'users',
  description: 'User entity for authentication and authorization',
  formMaxWidth: '700px',

  customListColumns: {},

  formTabs: [
    tab({
      name: 'General',
      order: 1,
      sections: [
        section({
          name: 'Information',
          order: 1,
          fields: [
            field({ name: 'name', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 100, placeholder: 'John Doe', filertable: ['main'], showOn: ['list', 'form'] }),
            field({ name: 'email', order: 2, type: FieldTypes.EMAIL, default: '', required: true, label: 'Email', dbField: 'email', maxLength: 254, placeholder: 'email@yahoo.com', showOn: ['list', 'form'] }),
            field({ name: 'phone', order: 3, type: FieldTypes.PHONE, default: '', required: true, label: 'Phone', dbField: 'phone', maxLength: 20, placeholder: '(xxx) xxx-xxxx', showOn: ['list', 'form'] }),
            field({ name: 'password', order: 3, type: 'password', default: '', required: true, label: 'Password', dbField: 'password', maxLength: 200, placeholder: '********', showOn: ['form'] }),
            field({ name: 'role', order: 4, type: FieldTypes.STRING, default: 'viewer', required: false, label: 'Role', dbField: 'role', maxLength: 20, enumValues: ['admin', 'manager', 'technician', 'viewer'], placeholder: 'viewer', filertable: ['true'], showOn: ['list', 'form'] }),
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
      ],
    }),
    tab({
      name: 'Security',
      order: 2,
      sections: [
        section({
          name: 'Permissions',
          order: 1,
          maxWidth: '400px',
          fields: [
            field({ name: 'permissions', order: 1, type: FieldTypes.JSON, default: {}, required: false, label: '', dbField: 'permissions', showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Password Reset',
          order: 2,
          maxWidth: '200px',
          fields: [
            field({ name: 'password_reset_actions', order: 1, type: FieldTypes.STRING, default: '', required: false, label: 'Password Management', dbField: '', readOnly: true, showOn: ['form'], description: 'Actions for managing user password' }),
            field({ name: 'password_reset_token', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Reset Token', dbField: 'password_reset_token', maxLength: 200, readOnly: true, showOn: ['form'], placeholder: 'No active reset', description: 'Active password reset token if one exists' }),
            field({ name: 'password_reset_expires_at', order: 3, type: FieldTypes.DATE, default: null, required: false, label: 'Token Expires', dbField: 'password_reset_expires_at', readOnly: true, showOn: ['form'], placeholder: 'No expiration', description: 'When the reset token expires' }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    users_id: field({ name: 'users_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'users_id' }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
    passwordHash: field({ name: 'passwordHash', type: FieldTypes.STRING, default: '', required: false, label: 'Password Hash', dbField: 'passwordhash', maxLength: 200, readOnly: true }),
    createdAt: field({ name: 'createdAt', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
    updatedAt: field({ name: 'updatedAt', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
    lastLogin: field({ name: 'lastLogin', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Last Login', dbField: 'last_login_at' }),
    passwordChangedAt: field({ name: 'passwordChangedAt', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Password Changed At', dbField: 'password_changed_at' }),
    failedLoginAttempts: field({ name: 'failedLoginAttempts', type: FieldTypes.NUMBER, default: 0, readOnly: false, label: 'Failed Login Attempts', dbField: 'failed_login_attempts' }),
    lockedUntil: field({ name: 'lockedUntil', type: FieldTypes.DATE, default: null, readOnly: false, label: 'Locked Until', dbField: 'locked_until' }),
  },

  relationships: {
    tenant: relationship({
      type: RelationshipTypes.BELONGS_TO,
      model: 'Tenant',
      foreignKey: 'tenant_id',
      autoLoad: false,
    }),
  },

  validation: {},
});

// ===== TENANT (from TenantWithSchema.js) =====
const tenantSchema = defineSchema({
  entityName: 'Tenant',
  tableName: 'tenant',
  description: 'Tenant entity for multi-tenant isolation',

  customListColumns: {},

  formFields: {
    name: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 100, placeholder: 'Company Name' }),
    url: field({ type: FieldTypes.URL, default: '', required: false, label: 'Website URL', dbField: 'url', maxLength: 255, placeholder: 'https://example.com' }),
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

// ===== METER READING (from MeterReadingsWithSchema.js) =====
const meterReadingSchema = defineSchema({
  entityName: 'MeterReadings',
  tableName: 'meter_reading',
  description: 'MeterReadings entity',

  customListColumns: {},

  formFields: {
    source: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Source', dbField: 'source', maxLength: 100 }),
    quality: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Quality', dbField: 'quality', maxLength: 20 }),
    voltage: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Voltage', dbField: 'voltage' }),
    current: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Current', dbField: 'current' }),
    power: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Power', dbField: 'power' }),
    energy: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Energy', dbField: 'energy' }),
    frequency: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Frequency', dbField: 'frequency' }),
    powerfactor: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Powerfactor', dbField: 'powerfactor' }),
    temperature: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Temperature', dbField: 'temperature' }),
    kwh: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Kwh', dbField: 'kwh' }),
    kw: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Kw', dbField: 'kw' }),
    v: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'V', dbField: 'v' }),
    a: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'A', dbField: 'a' }),
    dpf: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Dpf', dbField: 'dpf' }),
    dpfchannel: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Dpfchannel', dbField: 'dpfchannel' }),
    kwpeak: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Kwpeak', dbField: 'kwpeak' }),
    kvarh: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Kvarh', dbField: 'kvarh' }),
    kvah: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Kvah', dbField: 'kvah' }),
    phaseavoltage: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phaseavoltage', dbField: 'phaseavoltage' }),
    phasebvoltage: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phasebvoltage', dbField: 'phasebvoltage' }),
    phasecvoltage: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phasecvoltage', dbField: 'phasecvoltage' }),
    phaseacurrent: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phaseacurrent', dbField: 'phaseacurrent' }),
    phasebcurrent: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phasebcurrent', dbField: 'phasebcurrent' }),
    phaseccurrent: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phaseccurrent', dbField: 'phaseccurrent' }),
    phaseapower: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phaseapower', dbField: 'phaseapower' }),
    phasebpower: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phasebpower', dbField: 'phasebpower' }),
    phasecpower: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Phasecpower', dbField: 'phasecpower' }),
    deviceIp: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Device Ip', dbField: 'device_ip', maxLength: 50 }),
    port: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Port', dbField: 'port' }),
    powerFactor: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Power Factor', dbField: 'power_factor' }),
    phaseAVoltage: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase A Voltage', dbField: 'phase_a_voltage' }),
    phaseBVoltage: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase B Voltage', dbField: 'phase_b_voltage' }),
    phaseCVoltage: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase C Voltage', dbField: 'phase_c_voltage' }),
    phaseACurrent: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase A Current', dbField: 'phase_a_current' }),
    phaseBCurrent: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase B Current', dbField: 'phase_b_current' }),
    phaseCCurrent: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase C Current', dbField: 'phase_c_current' }),
    phaseAPower: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase A Power', dbField: 'phase_a_power' }),
    phaseBPower: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase B Power', dbField: 'phase_b_power' }),
    phaseCPower: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase C Power', dbField: 'phase_c_power' }),
    lineToLineVoltageAb: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Line To Line Voltage Ab', dbField: 'line_to_line_voltage_ab' }),
    lineToLineVoltageBc: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Line To Line Voltage Bc', dbField: 'line_to_line_voltage_bc' }),
    lineToLineVoltageCa: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Line To Line Voltage Ca', dbField: 'line_to_line_voltage_ca' }),
    totalActivePower: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Total Active Power', dbField: 'total_active_power' }),
    totalReactivePower: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Total Reactive Power', dbField: 'total_reactive_power' }),
    totalApparentPower: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Total Apparent Power', dbField: 'total_apparent_power' }),
    totalActiveEnergyWh: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Total Active Energy Wh', dbField: 'total_active_energy_wh' }),
    totalReactiveEnergyVarh: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Total Reactive Energy Varh', dbField: 'total_reactive_energy_varh' }),
    totalApparentEnergyVah: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Total Apparent Energy Vah', dbField: 'total_apparent_energy_vah' }),
    frequencyHz: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Frequency Hz', dbField: 'frequency_hz' }),
    temperatureC: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Temperature C', dbField: 'temperature_c' }),
    humidity: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Humidity', dbField: 'humidity' }),
    neutralCurrent: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Neutral Current', dbField: 'neutral_current' }),
    phaseAPowerFactor: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase A Power Factor', dbField: 'phase_a_power_factor' }),
    phaseBPowerFactor: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase B Power Factor', dbField: 'phase_b_power_factor' }),
    phaseCPowerFactor: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase C Power Factor', dbField: 'phase_c_power_factor' }),
    voltageThd: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Thd', dbField: 'voltage_thd' }),
    currentThd: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Thd', dbField: 'current_thd' }),
    maxDemandKw: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Max Demand Kw', dbField: 'max_demand_kw' }),
    maxDemandKvar: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Max Demand Kvar', dbField: 'max_demand_kvar' }),
    maxDemandKva: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Max Demand Kva', dbField: 'max_demand_kva' }),
    voltageUnbalance: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Unbalance', dbField: 'voltage_unbalance' }),
    currentUnbalance: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Unbalance', dbField: 'current_unbalance' }),
    communicationStatus: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Communication Status', dbField: 'communication_status', maxLength: 20 }),
    deviceModel: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Device Model', dbField: 'device_model', maxLength: 100 }),
    firmwareVersion: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Firmware Version', dbField: 'firmware_version', maxLength: 100 }),
    serial_number: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Serial Number', dbField: 'serial_number', maxLength: 100 }),
    alarmStatus: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Alarm Status', dbField: 'alarm_status', maxLength: 20 }),
    dataQuality: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Data Quality', dbField: 'data_quality', maxLength: 20 }),
    rawBasic: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Raw Basic', dbField: 'raw_basic' }),
    rawExtended: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Raw Extended', dbField: 'raw_extended' }),
    importActiveEnergyWh: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Import Active Energy Wh', dbField: 'import_active_energy_wh' }),
    exportActiveEnergyWh: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Export Active Energy Wh', dbField: 'export_active_energy_wh' }),
    importReactiveEnergyVarh: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Import Reactive Energy Varh', dbField: 'import_reactive_energy_varh' }),
    exportReactiveEnergyVarh: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Export Reactive Energy Varh', dbField: 'export_reactive_energy_varh' }),
    groundCurrent: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Ground Current', dbField: 'ground_current' }),
    voltageThdPhaseA: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Thd Phase A', dbField: 'voltage_thd_phase_a' }),
    voltageThdPhaseB: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Thd Phase B', dbField: 'voltage_thd_phase_b' }),
    voltageThdPhaseC: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Thd Phase C', dbField: 'voltage_thd_phase_c' }),
    currentThdPhaseA: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Thd Phase A', dbField: 'current_thd_phase_a' }),
    currentThdPhaseB: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Thd Phase B', dbField: 'current_thd_phase_b' }),
    currentThdPhaseC: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Thd Phase C', dbField: 'current_thd_phase_c' }),
    voltageHarmonic_3: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Harmonic 3', dbField: 'voltage_harmonic_3' }),
    voltageHarmonic_5: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Harmonic 5', dbField: 'voltage_harmonic_5' }),
    voltageHarmonic_7: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Harmonic 7', dbField: 'voltage_harmonic_7' }),
    currentHarmonic_3: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Harmonic 3', dbField: 'current_harmonic_3' }),
    currentHarmonic_5: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Harmonic 5', dbField: 'current_harmonic_5' }),
    currentHarmonic_7: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Harmonic 7', dbField: 'current_harmonic_7' }),
    currentDemandKw: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Demand Kw', dbField: 'current_demand_kw' }),
    currentDemandKvar: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Demand Kvar', dbField: 'current_demand_kvar' }),
    currentDemandKva: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Demand Kva', dbField: 'current_demand_kva' }),
    predictedDemandKw: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Predicted Demand Kw', dbField: 'predicted_demand_kw' }),
    voltageFlicker: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Flicker', dbField: 'voltage_flicker' }),
    frequencyDeviation: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Frequency Deviation', dbField: 'frequency_deviation' }),
    phaseSequence: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase Sequence', dbField: 'phase_sequence', maxLength: 10 }),
    phaseRotation: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Phase Rotation', dbField: 'phase_rotation', maxLength: 10 }),
    powerDirection: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Power Direction', dbField: 'power_direction', maxLength: 10 }),
    reactiveDirection: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Reactive Direction', dbField: 'reactive_direction', maxLength: 12 }),
    lastCommunication: field({ type: FieldTypes.DATE, default: '', required: false, label: 'Last Communication', dbField: 'last_communication' }),
    manufacturerCode: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Manufacturer Code', dbField: 'manufacturer_code' }),
    deviceTime: field({ type: FieldTypes.DATE, default: '', required: false, label: 'Device Time', dbField: 'device_time' }),
    syncStatus: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Sync Status', dbField: 'sync_status', maxLength: 20 }),
    timeSource: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Time Source', dbField: 'time_source', maxLength: 20 }),
    eventCounter: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Event Counter', dbField: 'event_counter' }),
    lastEvent: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Last Event', dbField: 'last_event' }),
    currentTransformerRatio: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Current Transformer Ratio', dbField: 'current_transformer_ratio' }),
    voltageTransformerRatio: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Voltage Transformer Ratio', dbField: 'voltage_transformer_ratio' }),
    pulseConstant: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Pulse Constant', dbField: 'pulse_constant' }),
    status: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Status', dbField: 'status', maxLength: 20 }),
    unitOfMeasurement: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Unit Of Measurement', dbField: 'unit_of_measurement', maxLength: 20 }),
    meterId: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Meter Id', dbField: 'meter_id' }),
  },

  entityFields: {
    meter_reading_id: field({ name: 'meter_reading_id', type: FieldTypes.STRING, default: null, readOnly: true, label: 'Id', dbField: 'meter_reading_id' }),
    createdat: field({ name: 'createdat', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Createdat', dbField: 'created_at' }),
    tenantId: field({ name: 'tenantId', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Tenant Id', dbField: 'tenant_id' }),
  },

  relationships: {
    meter: relationship({ type: RelationshipTypes.BELONGS_TO, model: 'Meter', foreignKey: 'meter_id', autoLoad: false }),
  },

  validation: {},
});

// ===== METER ELEMENTS (from MeterElementsWithSchema.js) =====
const meterElementsSchema = defineSchema({
  entityName: 'MeterElement',
  tableName: 'meter_element',
  description: 'Meter element entity for managing individual elements within a meter',

  customListColumns: {},

  formFields: {
    element: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Element', dbField: 'element', maxLength: 255, placeholder: 'Enter element value', enumValues: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], showOn: ['form'] }),
    name: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 255, placeholder: 'Enter element name', showOn: ['list', 'form'] }),
  },

  entityFields: {
    meter_element_id: field({ name: 'meter_element_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'meter_element_id' }),
    meter_id: field({ name: 'meter_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Meter ID', dbField: 'meter_id' }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
    created_at: field({ name: 'created_at', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
    updated_at: field({ name: 'updated_at', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
  },

  validation: {},
});

// ===== REPORT (from ReportWithSchema.js) =====
const reportSchema = defineSchema({
  entityName: 'Report',
  tableName: 'report',
  description: 'Scheduled report configuration for automated email delivery',
  formMaxWidth: '600px',

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
            field({ name: 'type', order: 2, type: FieldTypes.SELECT, default: 'meter_readings', required: true, label: 'Report Type', dbField: 'type', enumValues: ['meter_readings', 'usage_summary', 'daily_summary'], enumLabels: { 'meter_readings': 'Meter Readings', 'usage_summary': 'Usage Summary', 'daily_summary': 'Daily Summary' }, filterable: ['true'], showOn: ['list', 'form'] }),
            field({ name: 'active', order: 3, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', filterable: ['true'], showOn: ['list', 'form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Schedule',
      order: 2,
      sections: [
        section({ name: 'Execution Schedule', order: 1, flex: 1, fields: [
          field({ name: 'schedule', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Schedule', dbField: 'schedule', placeholder: 'Daily at 9 AM', helpText: 'Cron format: minute hour day month day-of-week. Examples: 0 9 * * * (Daily at 9 AM), 0 9 * * 1 (Weekly on Monday)', showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Recipients',
      order: 3,
      sections: [
        section({ name: 'Email Recipients', order: 1, flex: 1, fields: [
          field({ name: 'recipients', order: 1, type: FieldTypes.STRING, default: [], required: true, label: 'Email Recipients', dbField: 'recipients', placeholder: 'user@example.com', helpText: 'Add email addresses to receive the report', showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Configuration',
      order: 4,
      sections: [
        section({ name: 'Type-Specific Settings', order: 1, flex: 1, fields: [
          field({ name: 'config', order: 1, type: FieldTypes.STRING, default: {}, required: false, label: 'Configuration', dbField: 'config', placeholder: 'Type-specific configuration', helpText: 'Configuration options specific to the selected report type', showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Meters & Elements',
      order: 5,
      sections: [
        section({ name: 'Select Meters and Elements', order: 1, flex: 1, fields: [
          field({ name: 'meter_ids', order: 1, type: 'custom', label: 'Meters and Elements', required: false, default: [], showOn: ['form'], customField: true }),
          field({ name: 'element_ids', order: 2, type: 'custom', label: 'Selected Elements', required: false, default: [], showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Registers',
      order: 6,
      sections: [
        section({ name: 'Select Registers', order: 1, flex: 1, fields: [
          field({ name: 'register_ids', order: 1, type: 'custom', label: 'Registers', required: false, default: [], showOn: ['form'], customField: true }),
        ] }),
      ],
    }),
    tab({
      name: 'Formatting',
      order: 7,
      sections: [
        section({ name: 'Output Format', order: 1, flex: 1, fields: [
          field({ name: 'html_format', order: 1, type: FieldTypes.BOOLEAN, label: 'Enable HTML Formatting', required: false, default: false, showOn: ['form'] }),
        ] }),
      ],
    }),
  ],
});

// ===== DASHBOARD (from DashboardWithSchema.js) =====
const dashboardSchema = defineSchema({
  entityName: 'Dashboard',
  tableName: 'dashboard',
  description: 'Dashboard card configuration for displaying aggregated meter reading data',

  customListColumns: {},

  formTabs: [
    tab({
      name: 'Card Configuration',
      order: 1,
      sections: [
        section({
          name: 'Basic Information',
          order: 1,
          minWidth: '350px',
          fields: [
            field({ name: 'card_name', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Card Name', dbField: 'card_name', minLength: 1, maxLength: 255, placeholder: 'Enter card name', showOn: ['list', 'form'] }),
            field({ name: 'card_description', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Description', dbField: 'card_description', maxLength: 1000, placeholder: 'Enter card description', showOn: ['form'] }),
            field({ name: 'meter_element_id', order: 3, type: FieldTypes.NUMBER, default: null, required: true, label: 'Meter Element', dbField: 'meter_element_id', min: 1, showOn: ['list', 'form'], validate: true, validationFields: ['name'] }),
            field({ name: 'meter_id', order: 4, type: FieldTypes.NUMBER, default: null, required: true, label: 'Meter', dbField: 'meter_id', min: 1, showOn: ['form'], validate: true, validationFields: ['name'] }),
          ],
        }),
        section({ name: 'Data Selection', order: 2, fields: [
          field({ name: 'selected_columns', order: 1, type: FieldTypes.OBJECT, default: [], required: true, label: 'Selected Power Columns', dbField: 'selected_columns', showOn: ['form'], description: 'Select which power columns to display on this card' }),
        ] }),
        section({ name: 'Time Frame', order: 3, fields: [
          field({ name: 'time_frame_type', order: 1, type: FieldTypes.STRING, default: 'last_month', required: true, label: 'Time Frame Type', dbField: 'time_frame_type', enumValues: ['custom', 'last_month', 'this_month_to_date', 'since_installation'], showOn: ['list', 'form'] }),
          field({ name: 'custom_start_date', order: 2, type: FieldTypes.DATE, default: null, required: false, label: 'Custom Start Date', dbField: 'custom_start_date', placeholder: 'Select start date', showOn: ['form'], description: 'Required when Time Frame Type is "custom"' }),
          field({ name: 'custom_end_date', order: 3, type: FieldTypes.DATE, default: null, required: false, label: 'Custom End Date', dbField: 'custom_end_date', placeholder: 'Select end date', showOn: ['form'], description: 'Required when Time Frame Type is "custom"' }),
        ] }),
        section({ name: 'Visualization', order: 4, fields: [
          field({ name: 'visualization_type', order: 1, type: FieldTypes.STRING, default: 'line', required: true, label: 'Visualization Type', dbField: 'visualization_type', enumValues: ['pie', 'line', 'candlestick', 'bar', 'area'], showOn: ['list', 'form'] }),
          field({ name: 'grouping_type', order: 2, type: FieldTypes.STRING, default: 'daily', required: true, label: 'Data Grouping', dbField: 'grouping_type', enumValues: ['total', 'hourly', 'daily', 'weekly', 'monthly'], showOn: ['list', 'form'], description: 'How to group the aggregated data' }),
        ] }),
        section({ name: 'Grid Layout', order: 5, fields: [
          field({ name: 'grid_x', order: 1, type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid X Position', dbField: 'grid_x', showOn: ['form'] }),
          field({ name: 'grid_y', order: 2, type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid Y Position', dbField: 'grid_y', showOn: ['form'] }),
          field({ name: 'grid_w', order: 3, type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid Width', dbField: 'grid_w', showOn: ['form'] }),
          field({ name: 'grid_h', order: 4, type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid Height', dbField: 'grid_h', showOn: ['form'] }),
        ] }),
      ],
    }),
    tab({
      name: 'Additional Info',
      order: 2,
      sectionOrientation: 'vertical',
      sections: [
        section({ name: 'Audit', order: 1, fields: [
          field({ name: 'created_at', order: 1, type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'created_at', showOn: ['form'] }),
          field({ name: 'updated_at', order: 2, type: FieldTypes.DATE, default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at', showOn: ['form'] }),
        ] }),
      ],
    }),
  ],

  formFields: {
    card_name: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Card Name', dbField: 'card_name', minLength: 1, maxLength: 255, showOn: ['list', 'form'] }),
    card_description: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Description', dbField: 'card_description', maxLength: 1000, showOn: ['form'] }),
    meter_element_id: field({ type: FieldTypes.NUMBER, default: null, required: true, label: 'Meter Element', dbField: 'meter_element_id', min: 1, showOn: ['list', 'form'], validate: true }),
    meter_id: field({ type: FieldTypes.NUMBER, default: null, required: true, label: 'Meter', dbField: 'meter_id', min: 1, showOn: ['form'], validate: true }),
    selected_columns: field({ type: FieldTypes.OBJECT, default: [], required: true, label: 'Selected Power Columns', dbField: 'selected_columns', showOn: ['form'] }),
    time_frame_type: field({ type: FieldTypes.STRING, default: 'last_month', required: true, label: 'Time Frame Type', dbField: 'time_frame_type', enumValues: ['custom', 'last_month', 'this_month_to_date', 'since_installation'], showOn: ['list', 'form'] }),
    custom_start_date: field({ type: FieldTypes.DATE, default: null, required: false, label: 'Custom Start Date', dbField: 'custom_start_date', showOn: ['form'] }),
    custom_end_date: field({ type: FieldTypes.DATE, default: null, required: false, label: 'Custom End Date', dbField: 'custom_end_date', showOn: ['form'] }),
    visualization_type: field({ type: FieldTypes.STRING, default: 'line', required: true, label: 'Visualization Type', dbField: 'visualization_type', enumValues: ['pie', 'line', 'candlestick', 'bar', 'area'], showOn: ['list', 'form'] }),
    grouping_type: field({ type: FieldTypes.STRING, default: 'daily', required: true, label: 'Data Grouping', dbField: 'grouping_type', enumValues: ['total', 'hourly', 'daily', 'weekly', 'monthly'], showOn: ['list', 'form'] }),
    grid_x: field({ type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid X Position', dbField: 'grid_x', showOn: ['form'] }),
    grid_y: field({ type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid Y Position', dbField: 'grid_y', showOn: ['form'] }),
    grid_w: field({ type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid Width', dbField: 'grid_w', showOn: ['form'] }),
    grid_h: field({ type: FieldTypes.NUMBER, default: null, required: false, label: 'Grid Height', dbField: 'grid_h', showOn: ['form'] }),
  },

  entityFields: {
    dashboard_id: field({ name: 'dashboard_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'dashboard_id' }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: 0, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
    created_by_users_id: field({ name: 'created_by_users_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Created By User ID', dbField: 'created_by_users_id' }),
    created_at: field({ name: 'created_at', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'created_at' }),
    updated_at: field({ name: 'updated_at', type: FieldTypes.DATE, default: null, readOnly: true, label: 'Updated At', dbField: 'updated_at' }),
    grid_x: field({ name: 'grid_x', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Grid X Position', dbField: 'grid_x' }),
    grid_y: field({ name: 'grid_y', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Grid Y Position', dbField: 'grid_y' }),
    grid_w: field({ name: 'grid_w', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Grid Width', dbField: 'grid_w' }),
    grid_h: field({ name: 'grid_h', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Grid Height', dbField: 'grid_h' }),
  },

  validation: {},
});

// ===== AUTH LOGS (from AuthLogsWithSchema.js) =====
const authLogsSchema = defineSchema({
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

// ===== EMAIL TEMPLATES (from EmailTemplatesWithSchema.js - commented out in source) =====
const emailTemplatesSchema = defineSchema({
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
    lastused: field({ type: FieldTypes.DATE, default: '', required: false, label: 'Last Used', dbField: 'lastused' }),
    createdby: field({ type: FieldTypes.NUMBER, default: 0, required: false, label: 'Created By', dbField: 'createdby' }),
  },

  entityFields: {
    id: field({ name: 'email_template_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Id', dbField: 'email_template_id' }),
    createdat: field({ type: FieldTypes.DATE, default: null, readOnly: true, label: 'Created At', dbField: 'createdat' }),
    updatedat: field({ type: FieldTypes.DATE, default: null, readOnly: true, label: 'Updated At', dbField: 'updatedat' }),
    tenantId: field({ type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Tenant ID', dbField: 'tenant_id' }),
  },

  validation: {},
});

// ---------------------------------------------------------------------------
// SCHEMA REGISTRY - maps entity names to their defineSchema() results
// ---------------------------------------------------------------------------
const schemas: Record<string, any> = {
  meter: meterSchema,
  location: locationSchema,
  contact: contactSchema,
  device: deviceSchema,
  user: userSchema,
  tenant: tenantSchema,
  meter_reading: meterReadingSchema,
  meterReadings: { $ref: 'meter_reading' },
  meterElements: meterElementsSchema,
  report: reportSchema,
  dashboard: dashboardSchema,
  authLogs: authLogsSchema,
  emailTemplates: emailTemplatesSchema,
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
        const json = schema.toJSON();
        return {
          entityName: json.entityName,
          tableName: json.tableName,
          description: json.description,
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

    // Use toJSON() - the SAME serialization pipeline as the Node.js API
    return c.json({ success: true, data: schema.toJSON() });
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
    const result = schema.validate(data);

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to validate data', error: error.message }, 500);
  }
});

export default app;
