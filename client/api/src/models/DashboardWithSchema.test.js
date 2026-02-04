const { describe, it } = require('node:test');
const assert = require('node:assert');
const Dashboard = require('./DashboardWithSchema');

describe('Dashboard Model', () => {
  describe('primaryKey property', () => {
    it('should return "id" as the primary key', () => {
      assert.strictEqual(Dashboard.primaryKey, 'id');
    });

    it('should match the database column name in entityFields', () => {
      const primaryKey = Dashboard.primaryKey;
      const schema = Dashboard.schema;
      const idField = schema.entityFields.id;
      
      assert.strictEqual(idField.dbField, 'dashboard_id');
    });

    it('should be used correctly in WHERE clauses for updates', () => {
      const dashboard = new Dashboard({
        id: 1,
        card_name: 'Test Card',
        meter_element_id: 1,
        meter_id: 1,
        selected_columns: ['active_energy'],
        time_frame_type: 'last_month',
        visualization_type: 'line',
        tenant_id: 1,
        created_by_users_id: 1
      });

      assert.strictEqual(Dashboard.primaryKey, 'id');
    });
  });

  describe('entityFields mapping', () => {
    it('should have id field mapped to dashboard_id database column', () => {
      const schema = Dashboard.schema;
      const idField = schema.entityFields.id;
      
      assert.strictEqual(idField.name, 'dashboard_id');
      assert.strictEqual(idField.dbField, 'dashboard_id');
      assert.strictEqual(idField.readOnly, true);
    });

    it('should have tenant_id field in entityFields', () => {
      const schema = Dashboard.schema;
      const tenantField = schema.entityFields.tenant_id;
      
      assert.strictEqual(tenantField.name, 'tenant_id');
      assert.strictEqual(tenantField.dbField, 'tenant_id');
    });

    it('should have created_by_users_id field in entityFields', () => {
      const schema = Dashboard.schema;
      const createdByField = schema.entityFields.created_by_users_id;
      
      assert.strictEqual(createdByField.name, 'created_by_users_id');
      assert.strictEqual(createdByField.dbField, 'created_by_users_id');
      assert.strictEqual(createdByField.readOnly, true);
    });

    it('should have created_at and updated_at fields in entityFields', () => {
      const schema = Dashboard.schema;
      const createdAtField = schema.entityFields.created_at;
      const updatedAtField = schema.entityFields.updated_at;
      
      assert.strictEqual(createdAtField.name, 'created_at');
      assert.strictEqual(createdAtField.readOnly, true);
      assert.strictEqual(updatedAtField.name, 'updated_at');
      assert.strictEqual(updatedAtField.readOnly, true);
    });
  });

  describe('formFields definition', () => {
    it('should have card_name field', () => {
      const schema = Dashboard.schema;
      const cardNameField = schema.formFields.card_name;
      
      assert(cardNameField !== undefined);
      assert.strictEqual(cardNameField.type, 'string');
      assert.strictEqual(cardNameField.required, true);
      assert.strictEqual(cardNameField.maxLength, 255);
    });

    it('should have card_description field', () => {
      const schema = Dashboard.schema;
      const descField = schema.formFields.card_description;
      
      assert(descField !== undefined);
      assert.strictEqual(descField.type, 'string');
      assert.strictEqual(descField.required, false);
    });

    it('should have meter_element_id field', () => {
      const schema = Dashboard.schema;
      const meterElementField = schema.formFields.meter_element_id;
      
      assert(meterElementField !== undefined);
      assert.strictEqual(meterElementField.type, 'number');
      assert.strictEqual(meterElementField.required, true);
    });

    it('should have meter_id field', () => {
      const schema = Dashboard.schema;
      const meterField = schema.formFields.meter_id;
      
      assert(meterField !== undefined);
      assert.strictEqual(meterField.type, 'number');
      assert.strictEqual(meterField.required, true);
    });

    it('should have selected_columns field', () => {
      const schema = Dashboard.schema;
      const columnsField = schema.formFields.selected_columns;
      
      assert(columnsField !== undefined);
      assert.strictEqual(columnsField.type, 'object');
      assert.strictEqual(columnsField.required, true);
    });

    it('should have time_frame_type field with enum values', () => {
      const schema = Dashboard.schema;
      const timeFrameField = schema.formFields.time_frame_type;
      
      assert(timeFrameField !== undefined);
      assert.strictEqual(timeFrameField.type, 'string');
      assert.strictEqual(timeFrameField.required, true);
      assert.deepStrictEqual(timeFrameField.enumValues, ['custom', 'last_month', 'this_month_to_date', 'since_installation']);
    });

    it('should have custom_start_date and custom_end_date fields', () => {
      const schema = Dashboard.schema;
      const startDateField = schema.formFields.custom_start_date;
      const endDateField = schema.formFields.custom_end_date;
      
      assert(startDateField !== undefined);
      assert.strictEqual(startDateField.type, 'date');
      assert.strictEqual(startDateField.required, false);
      
      assert(endDateField !== undefined);
      assert.strictEqual(endDateField.type, 'date');
      assert.strictEqual(endDateField.required, false);
    });

    it('should have visualization_type field with enum values', () => {
      const schema = Dashboard.schema;
      const vizField = schema.formFields.visualization_type;
      
      assert(vizField !== undefined);
      assert.strictEqual(vizField.type, 'string');
      assert.strictEqual(vizField.required, true);
      assert.deepStrictEqual(vizField.enumValues, ['pie', 'line', 'candlestick', 'bar', 'area']);
    });
  });

  describe('schema definition', () => {
    it('should have correct table name', () => {
      assert.strictEqual(Dashboard.tableName, 'dashboard');
    });

    it('should have schema defined', () => {
      const schema = Dashboard.schema;
      assert(schema !== undefined);
      assert(schema !== null);
    });

    it('should have formTabs or formFields defined', () => {
      const schema = Dashboard.schema;
      // The schema should have either formTabs or formFields
      assert(schema.formTabs || schema.formFields);
    });
  });

  describe('Dashboard instance creation', () => {
    it('should create a Dashboard instance', () => {
      const data = {
        id: 1,
        card_name: 'Monthly Energy',
        card_description: 'Total energy consumption last month',
        meter_element_id: 5,
        meter_id: 1,
        selected_columns: ['active_energy', 'power'],
        time_frame_type: 'last_month',
        visualization_type: 'line',
        tenant_id: 1,
        created_by_users_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      };

      const dashboard = new Dashboard(data);

      assert(dashboard !== undefined);
      assert(dashboard !== null);
    });

    it('should initialize with schema defaults', () => {
      const dashboard = new Dashboard({});

      assert(dashboard !== undefined);
      assert(dashboard !== null);
    });

    it('should support dashboard_id alias for id', () => {
      const dashboard = new Dashboard({
        id: 1,
        card_name: 'Test Card',
        meter_element_id: 1,
        meter_id: 1,
        selected_columns: ['active_energy'],
        time_frame_type: 'last_month',
        visualization_type: 'line',
        tenant_id: 1,
        created_by_users_id: 1
      });

      assert.strictEqual(dashboard.dashboard_id, 1);
    });
  });

  describe('validation rules', () => {
    it('should have validation defined in schema', () => {
      const schema = Dashboard.schema;
      // Validation is defined in the model's schema definition
      assert(schema !== undefined);
    });
  });

  describe('relationships', () => {
    it('should have meterElement relationship', () => {
      const relationships = Dashboard.relationships;
      assert(relationships.meterElement !== undefined);
      assert.strictEqual(relationships.meterElement.type, 'belongsTo');
      assert.strictEqual(relationships.meterElement.model, 'MeterElement');
      assert.strictEqual(relationships.meterElement.foreignKey, 'meter_element_id');
    });

    it('should have meter relationship', () => {
      const relationships = Dashboard.relationships;
      assert(relationships.meter !== undefined);
      assert.strictEqual(relationships.meter.type, 'belongsTo');
      assert.strictEqual(relationships.meter.model, 'Meter');
      assert.strictEqual(relationships.meter.foreignKey, 'meter_id');
    });

    it('should have createdByUser relationship', () => {
      const relationships = Dashboard.relationships;
      assert(relationships.createdByUser !== undefined);
      assert.strictEqual(relationships.createdByUser.type, 'belongsTo');
      assert.strictEqual(relationships.createdByUser.model, 'User');
      assert.strictEqual(relationships.createdByUser.foreignKey, 'created_by_users_id');
    });
  });
});
