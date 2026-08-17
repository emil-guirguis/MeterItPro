// ===== REGISTER SCHEMA =====
import { defineSchema, field, FieldTypes } from '@meterit/framework-backend/api/base/SchemaDefinition';

export const registerSchema = defineSchema({
  entityName: 'Registers',
  tableName: 'register',
  description: 'Register entity',

  customListColumns: {},

  formFields: {
    register: field({
      type: FieldTypes.NUMBER,
      default: 0,
      required: true,
      label: 'Register Number',
      dbField: 'register',
    }),
    name: field({
      type: FieldTypes.STRING,
      default: '',
      required: true,
      label: 'Register Name',
      dbField: 'name',
      maxLength: 255,
    }),
    unit: field({
      type: FieldTypes.STRING,
      default: '',
      required: false,
      label: 'Unit',
      dbField: 'unit',
      maxLength: 50,
    }),
    field_name: field({
      type: FieldTypes.STRING,
      default: '',
      required: true,
      label: 'Field Name',
      dbField: 'field_name',
      maxLength: 255,
    }),
    description: field({
      type: FieldTypes.STRING,
      default: '',
      required: false,
      label: 'Description',
      dbField: 'description',
      maxLength: 500,
    }),
  },

  entityFields: {
    register_id: field({
      name: 'register_id',
      type: FieldTypes.NUMBER,
      default: null,
      readOnly: true,
      label: 'Register ID',
      dbField: 'register_id',
    }),
  },

  validation: {},

  deleteRestrictions: [
    { table: 'device_register', fk: 'register_id', label: 'device register assignment' },
  ],
});
