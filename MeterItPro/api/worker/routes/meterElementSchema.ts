
// ===== METER ELEMENTS (from MeterElementsWithSchema.js) =====
import { defineSchema, field, tab, section, FieldTypes } from '@meterit/framework-backend/api/base/SchemaDefinition';

export const meterElementsSchema = defineSchema({
  entityName: 'MeterElement',
  tableName: 'meter_element',
  description: 'Meter element entity for managing individual elements within a meter',

  customListColumns: {},

  formFields: {
    element: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Element', dbField: 'element', maxLength: 255, placeholder: 'Enter element value', enumValues: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], showOn: ['form'] }),
    name: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', maxLength: 255, placeholder: 'Enter element name', showOn: ['list', 'form'] }),
  },

  entityFields: {
    meter_element_id: field({ name: 'meter_element_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'meter_element_id' }),
    meter_id: field({ name: 'meter_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Meter ID', dbField: 'meter_id' }),
    tenant_id: field({ name: 'tenant_id', type: FieldTypes.NUMBER, default: null, readOnly: false, label: 'Tenant ID', dbField: 'tenant_id' }),
  },

  validation: {},

  deleteRestrictions: [
    { table: 'meter_reading', fk: 'meter_element_id', label: 'meter reading' },
  ],
});