// @ts-nocheck
/**
 * Meter Model with Schema Definition
 * 
 * Single source of truth for Meter entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');
const { DEVICE_MANUFACTURERS } = require('../constants/enumerations');

class Meter extends BaseModel {
  constructor(data = {}) {
    super(data);

    // Auto-initialize all fields from schema
    // This eliminates the need to manually list every field!
    Meter.schema.initializeFromData(this, data);
  }

  /**
   * @override
   */
  static get tableName() {
    return 'meter';
  }

  /**
   * @override
   */
  static get primaryKey() {
    return 'meter_id';
  }

  /**
   * @override
   */
  static get relationships() {
    return {
      device: {
        type: 'belongsTo',
        model: 'Device',
        foreignKey: 'device_id',
        targetKey: 'id'
      },
      location: {
        type: 'belongsTo',
        model: 'Location',
        foreignKey: 'location_id',
        targetKey: 'id'
      }
    };
  }

  /**
   * @override
   */
  static get schema() {
    return defineSchema({
      entityName: 'Meter',
      tableName: 'meter',
      description: 'Meter entity for managing electric, gas, water, and other utility meters',
      formMaxWidth: '600px',

      customListColumns: {},

      // NEW: Hierarchical tab structure with embedded field definitions
      formTabs: [
        tab({
          name: 'Meter',
          order: 1,
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
                  showOn: ['list', 'form'],
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
                  default: 502,
                  required: true,
                  label: 'Port Number',
                  dbField: 'port',
                  min: 1,
                  max: 65535,
                  placeholder: '502',
                  showOn: ['form'],
                }),
              ],
            }),
            section({
              name: 'Status & Installation',
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
          sectionOrientation:'vertical',
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

      // Form fields - user can edit these (kept for backward compatibility and list display)
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
          label: 'Device Manufacturer',
          dbField: null,
          showOn: ['list'],
        }),

        model: field({
          type: FieldTypes.STRING,
          default: '',
          readOnly: true,
          label: 'Model',
          dbField: null,
          showOn: ['list'],
        }),
      },

      // Entity fields - read-only, system-managed
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

      validation: {
        custom: (data) => {
          const errors = {};

          // Ensure port and IP are both provided or both empty
          if (data.ip && !data.port) {
            errors.port = 'Port number is required when IP address is provided';
          }
          if (data.port && !data.ip) {
            errors.ip = 'IP address is required when port number is provided';
          }

          return errors;
        },
      },
    });
  }

  // ===== Custom Methods =====

  static async getStats() {
    const db = this._getDb();
    const query = `
      SELECT
        COUNT(*) as total_meters
        --,
        --COUNT(CASE WHEN type = 'electric' THEN 1 END) as electric_meters,
        --COUNT(CASE WHEN type = 'gas' THEN 1 END) as gas_meters,
        --COUNT(CASE WHEN type = 'water' THEN 1 END) as water_meters,
        --COUNT(DISTINCT location_id) as locations_with_meters
      FROM meter
    `;

    const result = await db.query(query);
    return result.rows[0];
  }
}

module.exports = Meter;
