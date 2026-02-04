// @ts-nocheck
/**
 * Meter Elements Model with Schema Definition
 * 
 * Single source of truth for Meter Element entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class MeterElement extends BaseModel {
  constructor(data = {}) {
    super(data);

    // Auto-initialize all fields from schema
    MeterElement.schema.initializeFromData(this, data);
  }

  /**
   * @override
   */
  static get tableName() {
    return 'meter_element';
  }

  /**
   * @override
   */
  static get primaryKey() {
    return 'meter_element_id';
  }

  /**
   * @override
   */
  static get relationships() {
    return {
      meter: {
        type: 'belongsTo',
        model: 'Meter',
        foreignKey: 'meter_id',
        targetKey: 'id'
      }
    };
  }

  /**
   * @override
   */
  static get schema() {
    return defineSchema({
      entityName: 'MeterElement',
      tableName: 'meter_element',
      description: 'Meter element entity for managing individual elements within a meter',

      customListColumns: {},

      // Form fields - user can edit these
      formFields: {
        element: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Element',
          dbField: 'element',
          maxLength: 255,
          placeholder: 'Enter element value',
          enumValues: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
          showOn: ['form'],
        }),

        name: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Name',
          dbField: 'name',
          maxLength: 255,
          placeholder: 'Enter element name',
          showOn: ['list', 'form'],
        }),

      },

      // Entity fields - read-only, system-managed
      entityFields: {
        meter_element_id: field({
          name: 'meter_element_id',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: true,
          label: 'ID',
          dbField: 'meter_element_id',
        }),

        meter_id: field({
          name: 'meter_id',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: true,
          label: 'Meter ID',
          dbField: 'meter_id',
        }),

        tenant_id: field({
          name: 'tenant_id',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: false,
          label: 'Tenant ID',
          dbField: 'tenant_id',
        }),

        created_at: field({
          name: 'created_at',
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Created At',
          dbField: 'created_at',
        }),

        updated_at: field({
          name: 'updated_at',
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Updated At',
          dbField: 'updated_at',
        }),
      },

      validation: {},
    });
  }
}

module.exports = MeterElement;
