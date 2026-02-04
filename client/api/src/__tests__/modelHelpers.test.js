const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildWhereClause } = require('../../../../framework/backend/shared/utils/modelHelpers');

describe('buildWhereClause with dbField support', () => {
  describe('WHERE clause uses dbField for column names', () => {
    it('should use dbField when building WHERE conditions', () => {
      // Define fields with dbField mappings
      const fields = [
        {
          name: 'id',
          dbField: 'contact_id',
          type: 'number'
        },
        {
          name: 'name',
          dbField: 'name',
          type: 'string'
        }
      ];

      // Build WHERE clause with id field (should use contact_id)
      const conditions = { id: 1 };
      const result = buildWhereClause(conditions, 'contact', 1, fields);

      // Verify the WHERE clause uses contact_id, not id
      assert(result.clause.includes('contact_id'));
      assert(!result.clause.includes('contact.id'));
      assert.strictEqual(result.clause, 'contact.contact_id = $1');
      assert.deepStrictEqual(result.values, [1]);
    });

    it('should use dbField for all operators', () => {
      const fields = [
        {
          name: 'id',
          dbField: 'contact_id',
          type: 'number'
        }
      ];

      // Test with 'eq' operator
      const eqResult = buildWhereClause({ id: { eq: 1 } }, 'contact', 1, fields);
      assert.strictEqual(eqResult.clause, 'contact.contact_id = $1');

      // Test with 'ne' operator
      const neResult = buildWhereClause({ id: { ne: 1 } }, 'contact', 1, fields);
      assert.strictEqual(neResult.clause, 'contact.contact_id != $1');

      // Test with 'gt' operator
      const gtResult = buildWhereClause({ id: { gt: 1 } }, 'contact', 1, fields);
      assert.strictEqual(gtResult.clause, 'contact.contact_id > $1');

      // Test with 'in' operator
      const inResult = buildWhereClause({ id: { in: [1, 2, 3] } }, 'contact', 1, fields);
      assert.strictEqual(inResult.clause, 'contact.contact_id IN ($1, $2, $3)');
      assert.deepStrictEqual(inResult.values, [1, 2, 3]);
    });

    it('should work without fields parameter (backward compatibility)', () => {
      // When fields is not provided, should use field name as-is
      const conditions = { id: 1 };
      const result = buildWhereClause(conditions, 'contact', 1);

      // Should use 'id' since no dbField mapping is provided
      assert.strictEqual(result.clause, 'contact.id = $1');
      assert.deepStrictEqual(result.values, [1]);
    });

    it('should handle multiple conditions with mixed dbField mappings', () => {
      const fields = [
        {
          name: 'id',
          dbField: 'contact_id',
          type: 'number'
        },
        {
          name: 'name',
          dbField: 'name',
          type: 'string'
        },
        {
          name: 'active',
          dbField: 'active',
          type: 'boolean'
        }
      ];

      const conditions = {
        id: 1,
        name: 'John',
        active: true
      };

      const result = buildWhereClause(conditions, 'contact', 1, fields);

      // Should use contact_id for id field, name for name field, active for active field
      assert(result.clause.includes('contact.contact_id = $1'));
      assert(result.clause.includes('contact.name = $2'));
      assert(result.clause.includes('contact.active = $3'));
      assert.deepStrictEqual(result.values, [1, 'John', true]);
    });

    it('should handle NULL conditions with dbField', () => {
      const fields = [
        {
          name: 'id',
          dbField: 'contact_id',
          type: 'number'
        }
      ];

      const conditions = { id: null };
      const result = buildWhereClause(conditions, 'contact', 1, fields);

      assert.strictEqual(result.clause, 'contact.contact_id IS NULL');
      assert.deepStrictEqual(result.values, []);
    });

    it('should handle BETWEEN operator with dbField', () => {
      const fields = [
        {
          name: 'id',
          dbField: 'contact_id',
          type: 'number'
        }
      ];

      const conditions = { id: { between: [1, 10] } };
      const result = buildWhereClause(conditions, 'contact', 1, fields);

      assert.strictEqual(result.clause, 'contact.contact_id BETWEEN $1 AND $2');
      assert.deepStrictEqual(result.values, [1, 10]);
    });
  });

  describe('Contact model primary key scenario', () => {
    it('should correctly build WHERE clause for Contact update with contact_id', () => {
      // Simulate Contact model fields
      const contactFields = [
        {
          name: 'id',
          dbField: 'contact_id',
          type: 'number',
          readOnly: true
        },
        {
          name: 'name',
          dbField: 'name',
          type: 'string'
        },
        {
          name: 'email',
          dbField: 'email',
          type: 'string'
        },
        {
          name: 'tenant_id',
          dbField: 'tenant_id',
          type: 'number'
        }
      ];

      // Simulate UPDATE WHERE clause for Contact with id=1
      const where = { id: 1 };
      const result = buildWhereClause(where, 'contact', 1, contactFields);

      // Should use contact_id column, not id
      assert.strictEqual(result.clause, 'contact.contact_id = $1');
      assert.deepStrictEqual(result.values, [1]);
    });
  });

  describe('Multi-model regression tests', () => {
    it('should correctly build WHERE clause for User model with users_id', () => {
      // Simulate User model fields
      const userFields = [
        {
          name: 'id',
          dbField: 'users_id',
          type: 'number',
          readOnly: true
        },
        {
          name: 'email',
          dbField: 'email',
          type: 'string'
        },
        {
          name: 'tenant_id',
          dbField: 'tenant_id',
          type: 'number'
        }
      ];

      // Simulate UPDATE WHERE clause for User with id=1
      const where = { id: 1 };
      const result = buildWhereClause(where, 'users', 1, userFields);

      // Should use users_id column, not id
      assert.strictEqual(result.clause, 'users.users_id = $1');
      assert.deepStrictEqual(result.values, [1]);
    });

    it('should correctly build WHERE clause for Device model with device_id', () => {
      // Simulate Device model fields
      const deviceFields = [
        {
          name: 'id',
          dbField: 'device_id',
          type: 'number',
          readOnly: true
        },
        {
          name: 'name',
          dbField: 'name',
          type: 'string'
        },
        {
          name: 'tenant_id',
          dbField: 'tenant_id',
          type: 'number'
        }
      ];

      // Simulate UPDATE WHERE clause for Device with id=1
      const where = { id: 1 };
      const result = buildWhereClause(where, 'device', 1, deviceFields);

      // Should use device_id column, not id
      assert.strictEqual(result.clause, 'device.device_id = $1');
      assert.deepStrictEqual(result.values, [1]);
    });

    it('should correctly build WHERE clause for Meter model with meter_id', () => {
      // Simulate Meter model fields
      const meterFields = [
        {
          name: 'id',
          dbField: 'meter_id',
          type: 'number',
          readOnly: true
        },
        {
          name: 'name',
          dbField: 'name',
          type: 'string'
        },
        {
          name: 'tenant_id',
          dbField: 'tenant_id',
          type: 'number'
        }
      ];

      // Simulate UPDATE WHERE clause for Meter with id=1
      const where = { id: 1 };
      const result = buildWhereClause(where, 'meter', 1, meterFields);

      // Should use meter_id column, not id
      assert.strictEqual(result.clause, 'meter.meter_id = $1');
      assert.deepStrictEqual(result.values, [1]);
    });

    it('should handle complex WHERE conditions across all models', () => {
      // Test that all models can handle complex WHERE conditions with their respective dbField mappings
      const models = [
        {
          name: 'Contact',
          tableName: 'contact',
          fields: [
            { name: 'id', dbField: 'contact_id', type: 'number' },
            { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
            { name: 'active', dbField: 'active', type: 'boolean' }
          ]
        },
        {
          name: 'User',
          tableName: 'users',
          fields: [
            { name: 'id', dbField: 'users_id', type: 'number' },
            { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
            { name: 'active', dbField: 'active', type: 'boolean' }
          ]
        },
        {
          name: 'Device',
          tableName: 'device',
          fields: [
            { name: 'id', dbField: 'device_id', type: 'number' },
            { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
            { name: 'active', dbField: 'active', type: 'boolean' }
          ]
        },
        {
          name: 'Meter',
          tableName: 'meter',
          fields: [
            { name: 'id', dbField: 'meter_id', type: 'number' },
            { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
            { name: 'active', dbField: 'active', type: 'boolean' }
          ]
        }
      ];

      for (const model of models) {
        const conditions = {
          id: 1,
          tenant_id: 100,
          active: true
        };

        const result = buildWhereClause(conditions, model.tableName, 1, model.fields);

        // Verify the WHERE clause uses the correct dbField for id
        const idField = model.fields.find(f => f.name === 'id');
        assert(idField, `id field not found in ${model.name} model`);
        const expectedIdColumn = idField.dbField;
        assert(result.clause.includes(`${model.tableName}.${expectedIdColumn} = $1`));
        assert(result.clause.includes(`${model.tableName}.tenant_id = $2`));
        assert(result.clause.includes(`${model.tableName}.active = $3`));
        assert.deepStrictEqual(result.values, [1, 100, true]);
      }
    });

    it('should handle IN operator with dbField across all models', () => {
      const models = [
        { name: 'Contact', tableName: 'contact', idDbField: 'contact_id' },
        { name: 'User', tableName: 'users', idDbField: 'users_id' },
        { name: 'Device', tableName: 'device', idDbField: 'device_id' },
        { name: 'Meter', tableName: 'meter', idDbField: 'meter_id' }
      ];

      for (const model of models) {
        const fields = [
          { name: 'id', dbField: model.idDbField, type: 'number' }
        ];

        const conditions = { id: { in: [1, 2, 3, 4, 5] } };
        const result = buildWhereClause(conditions, model.tableName, 1, fields);

        assert.strictEqual(result.clause, `${model.tableName}.${model.idDbField} IN ($1, $2, $3, $4, $5)`);
        assert.deepStrictEqual(result.values, [1, 2, 3, 4, 5]);
      }
    });
  });
});


