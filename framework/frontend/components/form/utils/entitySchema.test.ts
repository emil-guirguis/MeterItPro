/**
 * Entity Schema Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { defineEntitySchema, validateSchema } from './entitySchema';
import { field } from './formSchema';

describe('defineEntitySchema', () => {
  it('should create correct structure with form fields only', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '', required: true, label: 'Name' }),
        email: field({ type: 'email', default: '', required: true, label: 'Email' }),
      },
    });

    expect(schema.form).toBeDefined();
    expect(schema.form.getDefaults).toBeDefined();
    expect(schema.form.toApi).toBeDefined();
    expect(schema.form.fromApi).toBeDefined();
    expect(schema.definition).toBeDefined();
    expect(schema.isFormField('name')).toBe(true);
    expect(schema.isFormField('email')).toBe(true);
    expect(schema.isFormField('nonexistent')).toBe(false);
  });

  it('should create correct structure with form and entity fields', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '', required: true, label: 'Name' }),
      },
      entityFields: {
        id: { type: 'string', default: '', readOnly: true },
        createdAt: { type: 'date', default: new Date(), readOnly: true },
      },
    });

    expect(schema.isFormField('name')).toBe(true);
    expect(schema.isEntityField('id')).toBe(true);
    expect(schema.isEntityField('createdAt')).toBe(true);
    expect(schema.isEntityField('name')).toBe(false);
  });

  it('should handle legacy field mappings', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '', label: 'Name' }),
      },
      entityFields: {
        status: { type: 'string', default: 'active' },
      },
      legacyFields: {
        active: { maps: 'status', transform: (status: string) => status === 'active' },
      },
    });

    expect(schema.isLegacyField('active')).toBe(true);
    expect(schema.isLegacyField('status')).toBe(false);
  });

  it('should provide utility functions for field names', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
        email: field({ type: 'email', default: '' }),
      },
      entityFields: {
        id: { type: 'string', default: '' },
      },
      legacyFields: {
        active: { maps: 'status' },
      },
    });

    expect(schema.getFormFieldNames()).toEqual(['name', 'email']);
    expect(schema.getEntityFieldNames()).toEqual(['id']);
    expect(schema.getLegacyFieldNames()).toEqual(['active']);
    expect(schema.getAllFieldNames()).toEqual(['name', 'email', 'id', 'active']);
  });
});

describe('validateSchema', () => {
  it('should pass validation for valid schema', () => {
    const result = validateSchema({
      formFields: {
        name: field({ type: 'string', default: '', required: true }),
        email: field({ type: 'email', default: '', required: true }),
      },
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect duplicate field names', () => {
    const result = validateSchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
      },
      entityFields: {
        name: { type: 'string', default: '' },
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duplicate field names between formFields and entityFields: name');
  });

  it('should detect invalid legacy field mappings', () => {
    const result = validateSchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
      },
      legacyFields: {
        oldName: { maps: 'nonexistent' },
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("Legacy field 'oldName' maps to non-existent field"))).toBe(true);
  });

  it('should detect required fields without defaults', () => {
    const result = validateSchema({
      formFields: {
        name: field({ type: 'string', default: undefined as any, required: true }),
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("Required field 'name' must have a default value"))).toBe(true);
  });

  it('should pass validation with valid legacy mappings', () => {
    const result = validateSchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
      },
      entityFields: {
        status: { type: 'string', default: 'active' },
      },
      legacyFields: {
        active: { maps: 'status' },
      },
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('type inference', () => {
  it('should infer correct types for string fields', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
      },
    });

    type EntityType = typeof schema._entityType;
    const entity: EntityType = { name: 'test' };
    
    expect(entity.name).toBe('test');
  });

  it('should infer correct types for various field types', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
        age: field({ type: 'number', default: 0 }),
        active: field({ type: 'boolean', default: false }),
        email: field({ type: 'email', default: '' }),
      },
    });

    type EntityType = typeof schema._entityType;
    const entity: EntityType = {
      name: 'John',
      age: 30,
      active: true,
      email: 'john@example.com',
    };
    
    expect(entity.name).toBe('John');
    expect(entity.age).toBe(30);
    expect(entity.active).toBe(true);
    expect(entity.email).toBe('john@example.com');
  });

  it('should infer types including entity fields', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
      },
      entityFields: {
        id: { type: 'string', default: '' },
        createdAt: { type: 'date', default: new Date() },
      },
    });

    type EntityType = typeof schema._entityType;
    const entity: EntityType = {
      name: 'test',
      id: '123',
      createdAt: new Date(),
    };
    
    expect(entity.id).toBe('123');
    expect(entity.createdAt).toBeInstanceOf(Date);
  });
});

describe('form utilities integration', () => {
  it('should generate correct defaults from form fields', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: 'John' }),
        email: field({ type: 'email', default: 'john@example.com' }),
        age: field({ type: 'number', default: 25 }),
      },
    });

    const defaults = schema.form.getDefaults();
    
    expect(defaults).toEqual({
      name: 'John',
      email: 'john@example.com',
      age: 25,
    });
  });

  it('should transform form data to API format', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
        zipCode: field({ type: 'string', default: '', apiField: 'zip' }),
      },
    });

    const formData = { name: 'John', zipCode: '12345' };
    const apiData = schema.form.toApi(formData);
    
    expect(apiData).toEqual({
      name: 'John',
      zip: '12345',
    });
  });

  it('should transform API data to form format', () => {
    const schema = defineEntitySchema({
      formFields: {
        name: field({ type: 'string', default: '' }),
        zipCode: field({ type: 'string', default: '', apiField: 'zip' }),
      },
    });

    const apiData = { name: 'John', zip: '12345' };
    const formData = schema.form.fromApi(apiData);
    
    expect(formData).toEqual({
      name: 'John',
      zipCode: '12345',
    });
  });

  it('should handle custom transformations', () => {
    const schema = defineEntitySchema({
      formFields: {
        date: field({
          type: 'date',
          default: new Date(),
          toApi: (date: Date) => date.toISOString(),
          fromApi: (str: string) => new Date(str),
        }),
      },
    });

    const formData = { date: new Date('2024-01-01') };
    const apiData = schema.form.toApi(formData);
    
    expect(typeof apiData.date).toBe('string');
    expect(apiData.date).toBe('2024-01-01T00:00:00.000Z');

    const transformedBack = schema.form.fromApi(apiData);
    expect(transformedBack.date).toBeInstanceOf(Date);
  });
});
