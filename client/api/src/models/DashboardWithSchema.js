/**
 * Dashboard Model with Schema Definition
 * 
 * Single source of truth for Dashboard entity schema.
 * Manages dashboard card configurations for displaying aggregated meter reading data.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Dashboard extends BaseModel {
  constructor(data = {}) {
    super(data);

    // Auto-initialize all fields from schema
    Dashboard.schema.initializeFromData(this, data);
  }

  /**
   * Getter to provide id as an alias for dashboard_id
   * This ensures compatibility with BaseModel which expects 'id'
   */
  get id() {
    return this.dashboard_id;
  }

  /**
   * Setter to allow setting id
   */
  set id(value) {
    this.dashboard_id = value;
  }

  /**
   * @override
   */
  static get tableName() {
    return 'dashboard';
  }

  /**
   * @override
   */
  static get primaryKey() {
    return 'dashboard_id';
  }

  /**
   * @override
   */
  static get relationships() {
    return {
      meterElement: {
        type: 'belongsTo',
        model: 'MeterElement',
        foreignKey: 'meter_element_id',
        targetKey: 'id'
      },
      meter: {
        type: 'belongsTo',
        model: 'Meter',
        foreignKey: 'meter_id',
        targetKey: 'id'
      },
      createdByUser: {
        type: 'belongsTo',
        model: 'User',
        foreignKey: 'created_by_users_id',
        targetKey: 'users_id'
      }
    };
  }

  /**
   * @override
   */
  static get schema() {
    return defineSchema({
      entityName: 'Dashboard',
      tableName: 'dashboard',
      description: 'Dashboard card configuration for displaying aggregated meter reading data',

      customListColumns: {},

      // Hierarchical tab structure with embedded field definitions
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
                field({
                  name: 'card_name',
                  order: 1,
                  type: FieldTypes.STRING,
                  default: '',
                  required: true,
                  label: 'Card Name',
                  dbField: 'card_name',
                  minLength: 1,
                  maxLength: 255,
                  placeholder: 'Enter card name',
                  showOn: ['list', 'form'],
                }),
                field({
                  name: 'card_description',
                  order: 2,
                  type: FieldTypes.STRING,
                  default: '',
                  required: false,
                  label: 'Description',
                  dbField: 'card_description',
                  maxLength: 1000,
                  placeholder: 'Enter card description',
                  showOn: ['form'],
                }),
                field({
                  name: 'meter_element_id',
                  order: 3,
                  type: FieldTypes.NUMBER,
                  default: null,
                  required: true,
                  label: 'Meter Element',
                  dbField: 'meter_element_id',
                  min: 1,
                  showOn: ['list', 'form'],
                  validate: true,
                  validationFields: ['name'],
                }),
                field({
                  name: 'meter_id',
                  order: 4,
                  type: FieldTypes.NUMBER,
                  default: null,
                  required: true,
                  label: 'Meter',
                  dbField: 'meter_id',
                  min: 1,
                  showOn: ['form'],
                  validate: true,
                  validationFields: ['name'],
                }),
              ],
            }),
            section({
              name: 'Data Selection',
              order: 2,
              fields: [
                field({
                  name: 'selected_columns',
                  order: 1,
                  type: FieldTypes.OBJECT,
                  default: [],
                  required: true,
                  label: 'Selected Power Columns',
                  dbField: 'selected_columns',
                  showOn: ['form'],
                  description: 'Select which power columns to display on this card',
                }),
              ],
            }),
            section({
              name: 'Time Frame',
              order: 3,
              fields: [
                field({
                  name: 'time_frame_type',
                  order: 1,
                  type: FieldTypes.STRING,
                  default: 'last_month',
                  required: true,
                  label: 'Time Frame Type',
                  dbField: 'time_frame_type',
                  enumValues: ['custom', 'last_month', 'this_month_to_date', 'since_installation'],
                  showOn: ['list', 'form'],
                }),
                field({
                  name: 'custom_start_date',
                  order: 2,
                  type: FieldTypes.DATE,
                  default: null,
                  required: false,
                  label: 'Custom Start Date',
                  dbField: 'custom_start_date',
                  placeholder: 'Select start date',
                  showOn: ['form'],
                  description: 'Required when Time Frame Type is "custom"',
                }),
                field({
                  name: 'custom_end_date',
                  order: 3,
                  type: FieldTypes.DATE,
                  default: null,
                  required: false,
                  label: 'Custom End Date',
                  dbField: 'custom_end_date',
                  placeholder: 'Select end date',
                  showOn: ['form'],
                  description: 'Required when Time Frame Type is "custom"',
                }),
              ],
            }),
            section({
              name: 'Visualization',
              order: 4,
              fields: [
                field({
                  name: 'visualization_type',
                  order: 1,
                  type: FieldTypes.STRING,
                  default: 'line',
                  required: true,
                  label: 'Visualization Type',
                  dbField: 'visualization_type',
                  enumValues: ['pie', 'line', 'candlestick', 'bar', 'area'],
                  showOn: ['list', 'form'],
                }),
                field({
                  name: 'grouping_type',
                  order: 2,
                  type: FieldTypes.STRING,
                  default: 'daily',
                  required: true,
                  label: 'Data Grouping',
                  dbField: 'grouping_type',
                  enumValues: ['total', 'hourly', 'daily', 'weekly', 'monthly'],
                  showOn: ['list', 'form'],
                  description: 'How to group the aggregated data',
                }),
              ],
            }),
            section({
              name: 'Grid Layout',
              order: 5,
              fields: [
                field({
                  name: 'grid_x',
                  order: 1,
                  type: FieldTypes.NUMBER,
                  default: null,
                  required: false,
                  label: 'Grid X Position',
                  dbField: 'grid_x',
                  showOn: ['form'],
                }),
                field({
                  name: 'grid_y',
                  order: 2,
                  type: FieldTypes.NUMBER,
                  default: null,
                  required: false,
                  label: 'Grid Y Position',
                  dbField: 'grid_y',
                  showOn: ['form'],
                }),
                field({
                  name: 'grid_w',
                  order: 3,
                  type: FieldTypes.NUMBER,
                  default: null,
                  required: false,
                  label: 'Grid Width',
                  dbField: 'grid_w',
                  showOn: ['form'],
                }),
                field({
                  name: 'grid_h',
                  order: 4,
                  type: FieldTypes.NUMBER,
                  default: null,
                  required: false,
                  label: 'Grid Height',
                  dbField: 'grid_h',
                  showOn: ['form'],
                }),
              ],
            }),
          ],
        }),
        tab({
          name: 'Additional Info',
          order: 2,
          sectionOrientation: 'vertical',
          sections: [
            section({
              name: 'Audit',
              order: 1,
              fields: [
                field({
                  name: 'created_at',
                  order: 1,
                  type: FieldTypes.DATE,
                  default: null,
                  readOnly: true,
                  label: 'Created At',
                  dbField: 'created_at',
                  showOn: ['form'],
                }),
                field({
                  name: 'updated_at',
                  order: 2,
                  type: FieldTypes.DATE,
                  default: null,
                  readOnly: true,
                  label: 'Updated At',
                  dbField: 'updated_at',
                  showOn: ['form'],
                }),
              ],
            }),
          ],
        }),
      ],

      // Form fields - user can edit these
      formFields: {
        card_name: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Card Name',
          dbField: 'card_name',
          minLength: 1,
          maxLength: 255,
          showOn: ['list', 'form'],
        }),
        card_description: field({
          type: FieldTypes.STRING,
          default: '',
          required: false,
          label: 'Description',
          dbField: 'card_description',
          maxLength: 1000,
          showOn: ['form'],
        }),
        meter_element_id: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: true,
          label: 'Meter Element',
          dbField: 'meter_element_id',
          min: 1,
          showOn: ['list', 'form'],
          validate: true,
        }),
        meter_id: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: true,
          label: 'Meter',
          dbField: 'meter_id',
          min: 1,
          showOn: ['form'],
          validate: true,
        }),
        selected_columns: field({
          type: FieldTypes.OBJECT,
          default: [],
          required: true,
          label: 'Selected Power Columns',
          dbField: 'selected_columns',
          showOn: ['form'],
        }),
        time_frame_type: field({
          type: FieldTypes.STRING,
          default: 'last_month',
          required: true,
          label: 'Time Frame Type',
          dbField: 'time_frame_type',
          enumValues: ['custom', 'last_month', 'this_month_to_date', 'since_installation'],
          showOn: ['list', 'form'],
        }),
        custom_start_date: field({
          type: FieldTypes.DATE,
          default: null,
          required: false,
          label: 'Custom Start Date',
          dbField: 'custom_start_date',
          showOn: ['form'],
        }),
        custom_end_date: field({
          type: FieldTypes.DATE,
          default: null,
          required: false,
          label: 'Custom End Date',
          dbField: 'custom_end_date',
          showOn: ['form'],
        }),
        visualization_type: field({
          type: FieldTypes.STRING,
          default: 'line',
          required: true,
          label: 'Visualization Type',
          dbField: 'visualization_type',
          enumValues: ['pie', 'line', 'candlestick', 'bar', 'area'],
          showOn: ['list', 'form'],
        }),
        grouping_type: field({
          type: FieldTypes.STRING,
          default: 'daily',
          required: true,
          label: 'Data Grouping',
          dbField: 'grouping_type',
          enumValues: ['total', 'hourly', 'daily', 'weekly', 'monthly'],
          showOn: ['list', 'form'],
        }),
        grid_x: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: false,
          label: 'Grid X Position',
          dbField: 'grid_x',
          showOn: ['form'],
        }),
        grid_y: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: false,
          label: 'Grid Y Position',
          dbField: 'grid_y',
          showOn: ['form'],
        }),
        grid_w: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: false,
          label: 'Grid Width',
          dbField: 'grid_w',
          showOn: ['form'],
        }),
        grid_h: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: false,
          label: 'Grid Height',
          dbField: 'grid_h',
          showOn: ['form'],
        }),
      },

      // Entity fields - read-only, system-managed
      entityFields: {
        dashboard_id: field({
          name: 'dashboard_id',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: true,
          label: 'ID',
          dbField: 'dashboard_id',
        }),
        tenant_id: field({
          name: 'tenant_id',
          type: FieldTypes.NUMBER,
          default: 0,
          readOnly: false,
          label: 'Tenant ID',
          dbField: 'tenant_id',
        }),
        created_by_users_id: field({
          name: 'created_by_users_id',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: true,
          label: 'Created By User ID',
          dbField: 'created_by_users_id',
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
        grid_x: field({
          name: 'grid_x',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: false,
          label: 'Grid X Position',
          dbField: 'grid_x',
        }),
        grid_y: field({
          name: 'grid_y',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: false,
          label: 'Grid Y Position',
          dbField: 'grid_y',
        }),
        grid_w: field({
          name: 'grid_w',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: false,
          label: 'Grid Width',
          dbField: 'grid_w',
        }),
        grid_h: field({
          name: 'grid_h',
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: false,
          label: 'Grid Height',
          dbField: 'grid_h',
        }),
      },

      validation: {
        custom: (data) => {
          const errors = {};

          // Validate custom date range if time_frame_type is 'custom'
          if (data.time_frame_type === 'custom') {
            if (!data.custom_start_date) {
              errors.custom_start_date = 'Start date is required for custom time frame';
            }
            if (!data.custom_end_date) {
              errors.custom_end_date = 'End date is required for custom time frame';
            }
            if (data.custom_start_date && data.custom_end_date) {
              const startDate = new Date(data.custom_start_date);
              const endDate = new Date(data.custom_end_date);
              if (startDate >= endDate) {
                errors.custom_end_date = 'End date must be after start date';
              }
            }
          }

          // Validate selected_columns is not empty
          if (!data.selected_columns || (Array.isArray(data.selected_columns) && data.selected_columns.length === 0)) {
            errors.selected_columns = 'At least one power column must be selected';
          }

          // Validate visualization_type is supported
          const supportedVisualizations = ['pie', 'line', 'candlestick', 'bar', 'area'];
          if (data.visualization_type && !supportedVisualizations.includes(data.visualization_type)) {
            errors.visualization_type = `Visualization type must be one of: ${supportedVisualizations.join(', ')}`;
          }

          // Validate time_frame_type is supported
          const supportedTimeFrames = ['custom', 'last_month', 'this_month_to_date', 'since_installation'];
          if (data.time_frame_type && !supportedTimeFrames.includes(data.time_frame_type)) {
            errors.time_frame_type = `Time frame type must be one of: ${supportedTimeFrames.join(', ')}`;
          }

          // Validate grouping_type is supported
          const supportedGroupings = ['total', 'hourly', 'daily', 'weekly', 'monthly'];
          if (data.grouping_type && !supportedGroupings.includes(data.grouping_type)) {
            errors.grouping_type = `Grouping type must be one of: ${supportedGroupings.join(', ')}`;
          }

          return errors;
        },
      },
    });
  }

  // ===== Custom Methods =====

  /**
   * Get dashboard cards for a specific tenant
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<Array>} Array of dashboard cards
   */
  static async getByTenant(tenantId) {
    const db = this.getDb();
    const query = `
      SELECT *
      FROM dashboard
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Get dashboard cards created by a specific user
   * @param {number} userId - The user ID
   * @param {number} tenantId - The tenant ID (for security)
   * @returns {Promise<Array>} Array of dashboard cards
   */
  static async getByUser(userId, tenantId) {
    const db = this.getDb();
    const query = `
      SELECT *
      FROM dashboard
      WHERE created_by_users_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId, tenantId]);
    return result.rows;
  }

  /**
   * Get dashboard cards for a specific meter element
   * @param {number} meterElementId - The meter element ID
   * @param {number} tenantId - The tenant ID (for security)
   * @returns {Promise<Array>} Array of dashboard cards
   */
  static async getByMeterElement(meterElementId, tenantId) {
    const db = this.getDb();
    const query = `
      SELECT *
      FROM dashboard
      WHERE meter_element_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [meterElementId, tenantId]);
    return result.rows;
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  static async getStats() {
    const db = this.getDb();
    const query = `
      SELECT
        COUNT(*) as total_cards,
        COUNT(DISTINCT tenant_id) as total_tenants,
        COUNT(DISTINCT meter_element_id) as total_meter_elements,
        COUNT(DISTINCT visualization_type) as visualization_types_used
      FROM dashboard
    `;
    const result = await db.query(query);
    return result.rows[0];
  }
}

module.exports = Dashboard;
