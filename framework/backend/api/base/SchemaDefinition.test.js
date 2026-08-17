/**
 * SchemaDefinition Tests
 * 
 * Tests for the SchemaDefinition helper functions:
 * - tab() helper function
 * - section() helper function
 * - fieldRef() helper function
 * - field() helper function with new properties
 * - defineSchema() with formTabs support
 */

const {
  FieldTypes,
  RelationshipTypes,
  field,
  relationship,
  tab,
  section,
  fieldRef,
  defineSchema,
} = require('./SchemaDefinition');

describe('SchemaDefinition Helper Functions', () => {
  describe('fieldRef()', () => {
    it('should create a field reference with name and order', () => {
      const ref = fieldRef({
        name: 'email',
        order: 1,
      });

      expect(ref.name).toBe('email');
      expect(ref.order).toBe(1);
    });

    it('should create a field reference with name only', () => {
      const ref = fieldRef({
        name: 'phone',
      });

      expect(ref.name).toBe('phone');
      expect(ref.order).toBeNull();
    });

    it('should handle order of 0', () => {
      const ref = fieldRef({
        name: 'name',
        order: 0,
      });

      expect(ref.order).toBe(0);
    });
  });

  describe('section()', () => {
    it('should create a section with name, order, and fields', () => {
      const fields = [
        fieldRef({ name: 'name', order: 1 }),
        fieldRef({ name: 'email', order: 2 }),
      ];

      const sec = section({
        name: 'Basic Information',
        order: 1,
        fields,
      });

      expect(sec.name).toBe('Basic Information');
      expect(sec.order).toBe(1);
      expect(sec.fields).toHaveLength(2);
      expect(sec.fields[0].name).toBe('name');
    });

    it('should create a section with CSS width properties', () => {
      const sec = section({
        name: 'Contact Methods',
        order: 2,
        fields: [],
        minWidth: '300px',
        maxWidth: '600px',
      });

      expect(sec.minWidth).toBe('300px');
      expect(sec.maxWidth).toBe('600px');
    });

    it('should create a section with default values', () => {
      const sec = section({
        name: 'Notes',
      });

      expect(sec.name).toBe('Notes');
      expect(sec.order).toBeNull();
      expect(sec.fields).toEqual([]);
      expect(sec.minWidth).toBeNull();
      expect(sec.maxWidth).toBeNull();
    });

    it('should handle multiple fields in a section', () => {
      const fields = [
        fieldRef({ name: 'street', order: 1 }),
        fieldRef({ name: 'city', order: 2 }),
        fieldRef({ name: 'state', order: 3 }),
        fieldRef({ name: 'zip', order: 4 }),
      ];

      const sec = section({
        name: 'Address',
        order: 1,
        fields,
      });

      expect(sec.fields).toHaveLength(4);
    });
  });

  describe('tab()', () => {
    it('should create a tab with name, order, and sections', () => {
      const sections = [
        section({
          name: 'Basic Information',
          order: 1,
          fields: [fieldRef({ name: 'name', order: 1 })],
        }),
        section({
          name: 'Contact Methods',
          order: 2,
          fields: [fieldRef({ name: 'email', order: 1 })],
        }),
      ];

      const t = tab({
        name: 'Contact',
        order: 1,
        sections,
      });

      expect(t.name).toBe('Contact');
      expect(t.order).toBe(1);
      expect(t.sections).toHaveLength(2);
      expect(t.sections[0].name).toBe('Basic Information');
    });

    it('should create a tab with default values', () => {
      const t = tab({
        name: 'Additional Info',
      });

      expect(t.name).toBe('Additional Info');
      expect(t.order).toBeNull();
      expect(t.sections).toEqual([]);
    });

    it('should handle multiple sections in a tab', () => {
      const sections = [
        section({ name: 'Section 1', order: 1, fields: [] }),
        section({ name: 'Section 2', order: 2, fields: [] }),
        section({ name: 'Section 3', order: 3, fields: [] }),
      ];

      const t = tab({
        name: 'Multi-Section Tab',
        order: 1,
        sections,
      });

      expect(t.sections).toHaveLength(3);
    });
  });

  describe('field() with new properties', () => {
    it('should include order property', () => {
      const f = field({
        type: FieldTypes.STRING,
        label: 'Name',
        order: 1,
      });

      expect(f.order).toBe(1);
    });

    it('should include minWidth and maxWidth properties', () => {
      const f = field({
        type: FieldTypes.STRING,
        label: 'Email',
        minWidth: '250px',
        maxWidth: '500px',
      });

      expect(f.minWidth).toBe('250px');
      expect(f.maxWidth).toBe('500px');
    });

    it('should handle all properties together', () => {
      const f = field({
        type: FieldTypes.STRING,
        label: 'Company',
        required: true,
        order: 2,
        minWidth: '200px',
        maxWidth: '400px',
        minLength: 2,
        maxLength: 100,
      });

      expect(f.type).toBe(FieldTypes.STRING);
      expect(f.label).toBe('Company');
      expect(f.required).toBe(true);
      expect(f.order).toBe(2);
      expect(f.minWidth).toBe('200px');
      expect(f.maxWidth).toBe('400px');
      expect(f.minLength).toBe(2);
      expect(f.maxLength).toBe(100);
    });
  });

  describe('defineSchema() with formTabs', () => {
    it('should create a schema with formTabs', () => {
      const formTabs = [
        tab({
          name: 'Contact',
          order: 1,
          sections: [
            section({
              name: 'Basic Information',
              order: 1,
              fields: [
                fieldRef({ name: 'name', order: 1 }),
                fieldRef({ name: 'email', order: 2 }),
              ],
            }),
          ],
        }),
      ];

      const schema = defineSchema({
        entityName: 'Contact',
        tableName: 'contact',
        formFields: {
          name: field({ type: FieldTypes.STRING, label: 'Name' }),
          email: field({ type: FieldTypes.EMAIL, label: 'Email' }),
        },
        formTabs,
      });

      expect(schema.schema.entityName).toBe('Contact');
      expect(schema.schema.formTabs).toHaveLength(1);
      expect(schema.schema.formTabs[0].name).toBe('Contact');
      expect(schema.schema.formTabs[0].sections).toHaveLength(1);
    });

    it('should support both formTabs and formGrouping', () => {
      const formTabs = [
        tab({
          name: 'Contact',
          order: 1,
          sections: [
            section({
              name: 'Basic Information',
              order: 1,
              fields: [fieldRef({ name: 'name', order: 1 })],
            }),
          ],
        }),
      ];

      const schema = defineSchema({
        entityName: 'Contact',
        tableName: 'contact',
        formFields: {
          name: field({
            type: FieldTypes.STRING,
            label: 'Name',
            formGrouping: {
              tabName: 'Contact',
              sectionName: 'Basic Information',
              tabOrder: 1,
              sectionOrder: 1,
              fieldOrder: 1,
            },
          }),
        },
        formTabs,
      });

      expect(schema.schema.formTabs).not.toBeNull();
      expect(schema.schema.formFields.name.formGrouping).not.toBeNull();
    });

    it('should set formTabs to null if not provided', () => {
      const schema = defineSchema({
        entityName: 'Contact',
        tableName: 'contact',
        formFields: {
          name: field({ type: FieldTypes.STRING, label: 'Name' }),
        },
      });

      expect(schema.schema.formTabs).toBeNull();
    });

    it('should include version 1.2.0 for formTabs support', () => {
      const schema = defineSchema({
        entityName: 'Contact',
        tableName: 'contact',
        formFields: {},
      });

      expect(schema.schema.version).toBe('1.2.0');
    });

    it('should serialize formTabs in toJSON()', () => {
      const formTabs = [
        tab({
          name: 'Contact',
          order: 1,
          sections: [
            section({
              name: 'Basic Information',
              order: 1,
              fields: [fieldRef({ name: 'name', order: 1 })],
            }),
          ],
        }),
      ];

      const schema = defineSchema({
        entityName: 'Contact',
        tableName: 'contact',
        formFields: {
          name: field({ type: FieldTypes.STRING, label: 'Name' }),
        },
        formTabs,
      });

      const json = schema.toJSON();
      expect(json.formTabs).toBeDefined();
      expect(json.formTabs).toHaveLength(1);
      expect(json.formTabs[0].name).toBe('Contact');
    });

    it('should preserve flex properties in sections', () => {
      const formTabs = [
        tab({
          name: 'Contact',
          order: 1,
          sections: [
            section({
              name: 'Information',
              order: 1,
              flex: 1,
              fields: [fieldRef({ name: 'name', order: 1 })],
            }),
            section({
              name: 'Status',
              order: 2,
              flex: 0,
              flexGrow: 0,
              flexShrink: 1,
              maxWidth: '100px',
              fields: [fieldRef({ name: 'active', order: 1 })],
            }),
          ],
        }),
      ];

      const schema = defineSchema({
        entityName: 'Contact',
        tableName: 'contact',
        formFields: {
          name: field({ type: FieldTypes.STRING, label: 'Name' }),
          active: field({ type: FieldTypes.BOOLEAN, label: 'Active' }),
        },
        formTabs,
      });

      const json = schema.toJSON();
      expect(json.formTabs[0].sections[0].flex).toBe(1);
      expect(json.formTabs[0].sections[1].flex).toBe(0);
      expect(json.formTabs[0].sections[1].flexGrow).toBe(0);
      expect(json.formTabs[0].sections[1].flexShrink).toBe(1);
      expect(json.formTabs[0].sections[1].maxWidth).toBe('100px');
    });
  });

  describe('Complex formTabs structure', () => {
    it('should handle a complete Contact schema with multiple tabs and sections', () => {
      const formTabs = [
        tab({
          name: 'Contact',
          order: 1,
          sections: [
            section({
              name: 'Basic Information',
              order: 1,
              fields: [
                fieldRef({ name: 'name', order: 1 }),
                fieldRef({ name: 'company', order: 2 }),
                fieldRef({ name: 'role', order: 3 }),
                fieldRef({ name: 'email', order: 4 }),
              ],
            }),
            section({
              name: 'Contact Methods',
              order: 2,
              fields: [
                fieldRef({ name: 'phone', order: 1 }),
                fieldRef({ name: 'active', order: 2 }),
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
                fieldRef({ name: 'street', order: 1 }),
                fieldRef({ name: 'city', order: 2 }),
                fieldRef({ name: 'state', order: 3 }),
                fieldRef({ name: 'zip', order: 4 }),
                fieldRef({ name: 'country', order: 5 }),
              ],
            }),
          ],
        }),
        tab({
          name: 'Additional Info',
          order: 3,
          sections: [
            section({
              name: 'Notes',
              order: 1,
              fields: [fieldRef({ name: 'notes', order: 1 })],
            }),
          ],
        }),
      ];

      const schema = defineSchema({
        entityName: 'Contact',
        tableName: 'contact',
        formFields: {
          name: field({ type: FieldTypes.STRING, label: 'Name', required: true }),
          company: field({ type: FieldTypes.STRING, label: 'Company' }),
          role: field({ type: FieldTypes.STRING, label: 'Role' }),
          email: field({ type: FieldTypes.EMAIL, label: 'Email', required: true }),
          phone: field({ type: FieldTypes.PHONE, label: 'Phone' }),
          active: field({ type: FieldTypes.BOOLEAN, label: 'Active' }),
          street: field({ type: FieldTypes.STRING, label: 'Street' }),
          city: field({ type: FieldTypes.STRING, label: 'City' }),
          state: field({ type: FieldTypes.STRING, label: 'State' }),
          zip: field({ type: FieldTypes.STRING, label: 'ZIP' }),
          country: field({ type: FieldTypes.COUNTRY, label: 'Country' }),
          notes: field({ type: FieldTypes.STRING, label: 'Notes' }),
        },
        formTabs,
      });

      expect(schema.schema.formTabs).toHaveLength(3);
      expect(schema.schema.formTabs[0].sections).toHaveLength(2);
      expect(schema.schema.formTabs[1].sections).toHaveLength(1);
      expect(schema.schema.formTabs[2].sections).toHaveLength(1);

      // Verify tab ordering
      expect(schema.schema.formTabs[0].order).toBe(1);
      expect(schema.schema.formTabs[1].order).toBe(2);
      expect(schema.schema.formTabs[2].order).toBe(3);

      // Verify section ordering
      expect(schema.schema.formTabs[0].sections[0].order).toBe(1);
      expect(schema.schema.formTabs[0].sections[1].order).toBe(2);

      // Verify field references
      expect(schema.schema.formTabs[0].sections[0].fields).toHaveLength(4);
      expect(schema.schema.formTabs[0].sections[0].fields[0].name).toBe('name');
    });
  });
});
