/**
 * Schema routes - Hono worker
 * Returns simplified static schema objects for main entities.
 */

import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Static schema definitions
const schemas: Record<string, any> = {
  meter: {
    entityName: 'Meter',
    tableName: 'meter',
    primaryKey: 'meter_id',
    description: 'Meters for energy monitoring',
    formFields: {
      name: { type: 'text', label: 'Name', required: true, maxLength: 255 },
      serial_number: { type: 'text', label: 'Serial Number', maxLength: 100 },
      ip: { type: 'text', label: 'IP Address', maxLength: 45 },
      port: { type: 'number', label: 'Port' },
      protocol: { type: 'select', label: 'Protocol', options: ['modbus', 'bacnet', 'snmp'] },
      location_id: { type: 'select', label: 'Location', foreignKey: 'location.location_id' },
      device_id: { type: 'select', label: 'Device', foreignKey: 'device.device_id' },
      active: { type: 'boolean', label: 'Active', default: true },
      notes: { type: 'textarea', label: 'Notes' },
    },
    entityFields: {
      meter_id: { type: 'integer', primaryKey: true },
      tenant_id: { type: 'integer' },
      name: { type: 'text' },
      serial_number: { type: 'text' },
      ip: { type: 'text' },
      port: { type: 'integer' },
      protocol: { type: 'text' },
      location_id: { type: 'integer' },
      device_id: { type: 'integer' },
      active: { type: 'boolean' },
      notes: { type: 'text' },
      created_at: { type: 'timestamp' },
      updated_at: { type: 'timestamp' },
    },
  },
  location: {
    entityName: 'Location',
    tableName: 'location',
    primaryKey: 'location_id',
    description: 'Physical locations / buildings',
    formFields: {
      name: { type: 'text', label: 'Name', required: true, maxLength: 255 },
      street: { type: 'text', label: 'Street', maxLength: 255 },
      street2: { type: 'text', label: 'Street 2', maxLength: 255 },
      city: { type: 'text', label: 'City', maxLength: 100 },
      state: { type: 'text', label: 'State', maxLength: 50 },
      zip: { type: 'text', label: 'Zip', maxLength: 20 },
      country: { type: 'text', label: 'Country', maxLength: 100 },
    },
    entityFields: {
      location_id: { type: 'integer', primaryKey: true },
      tenant_id: { type: 'integer' },
      name: { type: 'text' },
      street: { type: 'text' },
      street2: { type: 'text' },
      city: { type: 'text' },
      state: { type: 'text' },
      zip: { type: 'text' },
      country: { type: 'text' },
      created_at: { type: 'timestamp' },
      updated_at: { type: 'timestamp' },
    },
  },
  contact: {
    entityName: 'Contact',
    tableName: 'contact',
    primaryKey: 'contact_id',
    description: 'Contacts associated with locations or tenants',
    formFields: {
      name: { type: 'text', label: 'Name', required: true, maxLength: 255 },
      email: { type: 'email', label: 'Email', maxLength: 255 },
      phone: { type: 'text', label: 'Phone', maxLength: 20 },
      title: { type: 'text', label: 'Title', maxLength: 100 },
      location_id: { type: 'select', label: 'Location', foreignKey: 'location.location_id' },
    },
    entityFields: {
      contact_id: { type: 'integer', primaryKey: true },
      tenant_id: { type: 'integer' },
      name: { type: 'text' },
      email: { type: 'text' },
      phone: { type: 'text' },
      title: { type: 'text' },
      location_id: { type: 'integer' },
      created_at: { type: 'timestamp' },
      updated_at: { type: 'timestamp' },
    },
  },
  device: {
    entityName: 'Device',
    tableName: 'device',
    primaryKey: 'device_id',
    description: 'Physical devices (BACnet/Modbus controllers)',
    formFields: {
      name: { type: 'text', label: 'Name', required: true, maxLength: 255 },
      type: { type: 'text', label: 'Type', maxLength: 100 },
      manufacturer: { type: 'text', label: 'Manufacturer', maxLength: 100 },
      model: { type: 'text', label: 'Model', maxLength: 100 },
      location: { type: 'text', label: 'Location', maxLength: 255 },
      status: { type: 'select', label: 'Status', options: ['active', 'inactive', 'maintenance'] },
    },
    entityFields: {
      device_id: { type: 'integer', primaryKey: true },
      tenant_id: { type: 'integer' },
      name: { type: 'text' },
      type: { type: 'text' },
      manufacturer: { type: 'text' },
      model: { type: 'text' },
      location: { type: 'text' },
      status: { type: 'text' },
      metadata: { type: 'jsonb' },
      created_at: { type: 'timestamp' },
      updated_at: { type: 'timestamp' },
    },
  },
  user: {
    entityName: 'User',
    tableName: 'users',
    primaryKey: 'users_id',
    description: 'System users',
    formFields: {
      name: { type: 'text', label: 'Name', required: true, maxLength: 255 },
      email: { type: 'email', label: 'Email', required: true, maxLength: 255 },
      phone: { type: 'text', label: 'Phone', maxLength: 20 },
      role: { type: 'select', label: 'Role', options: ['admin', 'Manager', 'Technician', 'Viewer'] },
      active: { type: 'boolean', label: 'Active', default: true },
    },
    entityFields: {
      users_id: { type: 'integer', primaryKey: true },
      tenant_id: { type: 'integer' },
      name: { type: 'text' },
      email: { type: 'text' },
      phone: { type: 'text' },
      role: { type: 'text' },
      active: { type: 'boolean' },
      permissions: { type: 'jsonb' },
      created_at: { type: 'timestamp' },
      updated_at: { type: 'timestamp' },
    },
  },
  meter_reading: {
    entityName: 'MeterReading',
    tableName: 'meter_reading',
    primaryKey: 'meter_reading_id',
    description: 'Meter reading data points',
    formFields: {},
    entityFields: {
      meter_reading_id: { type: 'integer', primaryKey: true },
      tenant_id: { type: 'integer' },
      meter_id: { type: 'integer' },
      meter_element_id: { type: 'integer' },
      active_energy: { type: 'numeric' },
      power: { type: 'numeric' },
      voltage_a_n: { type: 'numeric' },
      current: { type: 'numeric' },
      frequency: { type: 'numeric' },
      power_factor: { type: 'numeric' },
      created_at: { type: 'timestamp' },
    },
  },
  meterReadings: { $ref: 'meter_reading' },
  meterElements: {
    entityName: 'MeterElement',
    tableName: 'meter_element',
    primaryKey: 'meter_element_id',
    description: 'Meter element assignments',
    formFields: {
      name: { type: 'text', label: 'Name', required: true },
      element: { type: 'text', label: 'Element', required: true },
    },
    entityFields: {
      meter_element_id: { type: 'integer', primaryKey: true },
      meter_id: { type: 'integer' },
      tenant_id: { type: 'integer' },
      name: { type: 'text' },
      element: { type: 'text' },
    },
  },
  tenant: {
    entityName: 'Tenant',
    tableName: 'tenant',
    primaryKey: 'tenant_id',
    description: 'Tenant / organization',
    formFields: {
      name: { type: 'text', label: 'Name', required: true },
    },
    entityFields: {
      tenant_id: { type: 'integer', primaryKey: true },
      name: { type: 'text' },
      api_key: { type: 'uuid' },
      active: { type: 'boolean' },
    },
  },
  emailTemplates: {
    entityName: 'EmailTemplate',
    tableName: 'email_template',
    primaryKey: 'email_template_id',
    description: 'Email notification templates',
    formFields: {
      name: { type: 'text', label: 'Name', required: true },
      subject: { type: 'text', label: 'Subject', required: true },
      content: { type: 'textarea', label: 'Content', required: true },
      category: { type: 'select', label: 'Category', options: ['meter_readings', 'meter_errors', 'maintenance', 'general'] },
    },
    entityFields: {
      email_template_id: { type: 'integer', primaryKey: true },
      tenant_id: { type: 'integer' },
      name: { type: 'text' },
      subject: { type: 'text' },
      content: { type: 'text' },
      category: { type: 'text' },
      variables: { type: 'jsonb' },
      isactive: { type: 'boolean' },
      isdefault: { type: 'boolean' },
      usagecount: { type: 'integer' },
    },
  },
  report: {
    entityName: 'Report',
    tableName: 'report',
    primaryKey: 'report_id',
    description: 'Scheduled reports',
    formFields: {
      name: { type: 'text', label: 'Name', required: true },
      type: { type: 'text', label: 'Type', required: true },
      schedule: { type: 'text', label: 'Schedule (cron)', required: true },
      recipients: { type: 'array', label: 'Recipients', required: true },
    },
    entityFields: {
      report_id: { type: 'integer', primaryKey: true },
      name: { type: 'text' },
      type: { type: 'text' },
      schedule: { type: 'text' },
      recipients: { type: 'jsonb' },
      config: { type: 'jsonb' },
      enabled: { type: 'boolean' },
    },
  },
};

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
    return c.json({
      success: false,
      message: 'Failed to fetch schema list',
      error: error.message,
    }, 500);
  }
});

// GET /:entity - Get schema for a specific entity
app.get('/:entity', (c) => {
  try {
    const entity = c.req.param('entity');
    const schema = resolveSchema(entity);

    if (!schema) {
      return c.json({
        success: false,
        message: `Schema not found for entity: ${entity}`,
        availableEntities: Object.keys(schemas),
      }, 404);
    }

    return c.json({ success: true, data: schema });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Failed to fetch schema',
      error: error.message,
    }, 500);
  }
});

// POST /:entity/validate - Validate data against entity schema (simplified)
app.post('/:entity/validate', async (c) => {
  try {
    const entity = c.req.param('entity');
    const schema = resolveSchema(entity);

    if (!schema) {
      return c.json({
        success: false,
        message: `Schema not found for entity: ${entity}`,
      }, 404);
    }

    const data = await c.req.json();
    const errors: Record<string, string> = {};

    // Simple required field validation
    if (schema.formFields) {
      for (const [field, def] of Object.entries(schema.formFields) as [string, any][]) {
        if (def.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
          errors[field] = `${def.label || field} is required`;
        }
      }
    }

    return c.json({
      success: true,
      data: {
        isValid: Object.keys(errors).length === 0,
        errors,
      },
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Failed to validate data',
      error: error.message,
    }, 500);
  }
});

export default app;
