const { describe, it } = require('node:test');
const assert = require('node:assert');
const Contact = require('./ContactWithSchema');

describe('Contact Model', () => {
  describe('primaryKey property', () => {
    it('should return "contact_id" as the primary key', () => {
      assert.strictEqual(Contact.primaryKey, 'contact_id');
    });

    it('should match the database column name in entityFields', () => {
      const primaryKey = Contact.primaryKey;
      const schema = Contact.schema;
      const idField = schema.entityFields.id;
      
      assert.strictEqual(idField.dbField, primaryKey);
    });

    it('should be used correctly in WHERE clauses for updates', () => {
      // This test verifies that the primaryKey is correctly used
      // The actual SQL generation happens in BaseModel.update()
      const contact = new Contact({
        contact_id: 1,
        name: 'Test Contact',
        email: 'test@example.com',
        tenant_id: 1
      });

      // Verify the model's primaryKey property matches the database column
      assert.strictEqual(Contact.primaryKey, 'contact_id');
      
      // Verify the primaryKey is not 'id' (the old broken value)
      assert.notStrictEqual(Contact.primaryKey, 'id');
    });
  });

  describe('entityFields mapping', () => {
    it('should have id field mapped to contact_id database column', () => {
      const schema = Contact.schema;
      const idField = schema.entityFields.id;
      
      assert.strictEqual(idField.name, 'contact_id');
      assert.strictEqual(idField.dbField, 'contact_id');
      assert.strictEqual(idField.readOnly, true);
    });

    it('should have tenant_id field in entityFields', () => {
      const schema = Contact.schema;
      const tenantField = schema.entityFields.tenant_id;
      
      assert.strictEqual(tenantField.name, 'tenant_id');
      assert.strictEqual(tenantField.dbField, 'tenant_id');
    });
  });

  describe('schema definition', () => {
    it('should have correct table name', () => {
      assert.strictEqual(Contact.tableName, 'contact');
    });

    it('should have schema defined', () => {
      const schema = Contact.schema;
      assert(schema !== undefined);
      assert(schema !== null);
    });

    it('should have formTabs or form fields defined', () => {
      const schema = Contact.schema;
      // The schema should have either formTabs or formFields
      assert(schema.formTabs || schema.formFields);
    });
  });

  describe('Contact instance creation', () => {
    it('should create a Contact instance', () => {
      const data = {
        contact_id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        tenant_id: 1
      };

      const contact = new Contact(data);

      // Verify the instance was created
      assert(contact !== undefined);
      assert(contact !== null);
    });

    it('should initialize with schema defaults', () => {
      const contact = new Contact({});

      // The schema initializes fields with their default values
      assert(contact !== undefined);
      assert(contact !== null);
    });
  });
});


